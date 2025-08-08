import type { ServiceBusReceiver, ServiceBusSender } from "@azure/service-bus";
import type { Result, ResultAsync } from "neverthrow";
import type { z } from "zod";
import type { EventTransformer, ServiceEvent } from "@/event-transporter/core";
import { ServiceBusAdministrationClient, ServiceBusClient } from "@azure/service-bus";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { fromPromise } from "neverthrow";
import { EventTransporter } from "@/event-transporter/core";

async function createAzureServiceBusClient(connectionString: string) {
  try {
    // Create clients with simple connection timeout for better resilience
    const client = new ServiceBusClient(connectionString);
    const admin = new ServiceBusAdministrationClient(connectionString);

    // Test the connection by attempting to get service properties with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000);
    });
    
    await Promise.race([
      admin.getNamespaceProperties(),
      timeoutPromise,
    ]);
    
    logger.info("Connected to Azure Service Bus successfully");
    return { client, admin };
  } catch (error) {
    const err = asError(error);
    logger.error("Failed to connect to Azure Service Bus:", {
      message: err.message,
      code: (err as any).code || 'UNKNOWN',
      name: err.name,
      stack: err.stack,
    });
    throw wrapError(err, "Failed to connect to Azure Service Bus");
  }
}

export class AzureServiceBusTransporter extends EventTransporter {
  private admin: ServiceBusAdministrationClient;
  private client: ServiceBusClient;
  private senders: Map<string, ServiceBusSender> = new Map();
  private receivers: Map<string, ServiceBusReceiver> = new Map();

  private constructor(options: {
    transformer: EventTransformer;
    client: ServiceBusClient;
    admin: ServiceBusAdministrationClient;
  }) {
    super(options);
    this.client = options.client;
    this.admin = options.admin;
  }

  static create(options: { transformer: EventTransformer; connectionString: string }) {
    return fromPromise(createAzureServiceBusClient(options.connectionString), (error) =>
      wrapError(asError(error), "Failed to create Azure Service Bus client"),
    ).map((value) => {
      return new AzureServiceBusTransporter({
        transformer: options.transformer,
        client: value.client,
        admin: value.admin,
      });
    });
  }

  protected override async doEmit<T extends z.ZodType>(
    event: ServiceEvent<T>,
    data: object,
    callback?: (isError: boolean) => void,
  ): Promise<void> {
    let sender = this.senders.get(event.name);

    if (!sender) {
      try {
        // Ensure the topic exists before creating sender
        const topicExists = await this.admin.topicExists(event.name);
        if (!topicExists) {
          await this.admin.createTopic(event.name);
          logger.info(`Topic created for event: ${event.name}`);
        }
        
        sender = this.client.createSender(event.name);
        this.senders.set(event.name, sender);
      } catch (error) {
        logger.error(`Failed to create sender for event: ${event.name}`, error);
        callback?.(true);
        return;
      }
    }

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await sender.sendMessages({
          body: data,
          contentType: "application/json",
        });

        logger.info(`Message published successfully: ${event.name}`);
        callback?.(false);
        return;
      } catch (error) {
        attempt++;
        const err = asError(error);
        logger.warn(`Failed to publish message (attempt ${attempt}/${maxRetries}): ${event.name}`, {
          message: err.message,
          code: (err as any).code || 'UNKNOWN',
        });

        if (attempt >= maxRetries) {
          logger.error(`Failed to publish message after ${maxRetries} attempts: ${event.name}`, error);
          callback?.(true);
          
          // If it's a connection error, recreate the sender for next time
          if ((err as any).code === 'ECONNRESET' || (err as any).code === 'ETIMEDOUT') {
            this.senders.delete(event.name);
            try {
              await sender.close();
            } catch (closeError) {
              logger.debug(`Error closing sender: ${closeError}`);
            }
          }
          return;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 2**attempt * 1000));
      }
    }
  }

  protected override async doConsume<T extends z.ZodType>(
    event: ServiceEvent<T>,
    handler: (data: unknown) => Result<unknown, unknown> | ResultAsync<unknown, unknown>,
  ): Promise<void> {
    let receiver = this.receivers.get(event.name);

    if (!receiver) {
      const subscriptionName = `${event.name}-node-sub`;
      
      // First, ensure the topic exists
      const topicExists = await this.admin.topicExists(event.name);
      if (!topicExists) {
        await this.admin.createTopic(event.name);
        logger.info(`Topic created for event: ${event.name}`);
      }
      
      // Then, ensure the subscription exists
      const subscriptionExists = await this.admin.subscriptionExists(event.name, subscriptionName);
      if (!subscriptionExists) {
        await this.admin.createSubscription(event.name, subscriptionName);
        logger.info(`Subscription created for event: ${event.name}`);
      }

      receiver = this.client.createReceiver(event.name, subscriptionName);
      this.receivers.set(event.name, receiver);
    }

    receiver.subscribe(
      {
        processMessage: async (brokeredMessage) => {
          try {
            const content = brokeredMessage.body.message;
            const result = handler(content);
            const handlerResult = await (result instanceof Promise ? result : (
              Promise.resolve(result)
            ));

            handlerResult.match(
              () => {
                logger.debug(`Message processed successfully: ${event.name}`);
                // Message is automatically completed in peekLock mode when processMessage returns successfully
              },
              (error: unknown) => {
                logger.error(`Error processing message for event ${event.name}:`, error);
                // In peekLock mode, if processMessage throws, the message is automatically abandoned
                throw error;
              },
            );
          } catch (error) {
            logger.error(
              `Error parsing or processing message for event ${event.name}:`,
              error,
            );
            throw error; // This will cause the message to be abandoned
          }
        },
        processError: async (args) => {
          logger.error(`Error in message processing for ${event.name}:`, args.error);
        },
      },
      {
        // Enable concurrent message processing
        maxConcurrentCalls: 10, // Process up to 10 messages concurrently
        autoCompleteMessages: true, // Automatically complete messages on success
      }
    );
  }

  /**
   * Close all senders, receivers, and the client connection
   */
  async close(): Promise<void> {
    try {
      // Close all senders
      await Promise.all(
        Array.from(this.senders.values()).map((sender) => sender.close()),
      );
      this.senders.clear();

      // Close all receivers
      await Promise.all(
        Array.from(this.receivers.values()).map((receiver) => receiver.close()),
      );
      this.receivers.clear();

      // Close the client
      await this.client.close();

      logger.info("Azure Service Bus transporter closed successfully");
    } catch (error) {
      logger.error("Error closing Azure Service Bus transporter:", error);
      throw wrapError(asError(error), "Failed to close Azure Service Bus transporter");
    }
  }
}
