import type { ServiceBusReceiver, ServiceBusSender } from "@azure/service-bus";
import type { Result, ResultAsync } from "neverthrow";
import type { z } from "zod";
import type { EventTransformer, ServiceEvent } from "@/event-transporter/core";
import { ServiceBusClient } from "@azure/service-bus";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { fromPromise } from "neverthrow";
import { EventTransporter } from "@/event-transporter/core";

async function createAzureServiceBusClient(connectionString: string) {
  try {
    const client = new ServiceBusClient(connectionString);
    logger.info("Connected to Azure Service Bus");
    return client;
  } catch (error) {
    throw wrapError(asError(error), "Failed to connect to Azure Service Bus");
  }
}

export class AzureServiceBusTransporter extends EventTransporter {
  private client: ServiceBusClient;
  private senders: Map<string, ServiceBusSender> = new Map();
  private receivers: Map<string, ServiceBusReceiver> = new Map();

  private constructor(options: {
    transformer: EventTransformer;
    client: ServiceBusClient;
  }) {
    super(options);
    this.client = options.client;
  }

  static create(options: { transformer: EventTransformer; connectionString: string }) {
    return fromPromise(createAzureServiceBusClient(options.connectionString), (error) =>
      wrapError(asError(error), "Failed to create Azure Service Bus client"),
    ).map((client) => {
      return new AzureServiceBusTransporter({
        transformer: options.transformer,
        client,
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
      sender = this.client.createSender(event.name);
      this.senders.set(event.name, sender);
    }

    try {
      await sender.sendMessages({
        body: JSON.stringify(data),
        contentType: "application/json",
      });

      logger.info(`Message published successfully: ${event.name}`);
      callback?.(false);
    } catch (error) {
      logger.error(`Failed to publish message: ${event.name}`, error);
      callback?.(true);
    }
  }

  protected override async doConsume<T extends z.ZodType>(
    event: ServiceEvent<T>,
    handler: (
      data: unknown,
    ) => Result<unknown, unknown> | ResultAsync<unknown, unknown>,
  ): Promise<void> {
    let receiver = this.receivers.get(event.name);
    
    if (!receiver) {
      receiver = this.client.createReceiver(event.name);
      this.receivers.set(event.name, receiver);
    }

    receiver.subscribe({
      processMessage: async (brokeredMessage) => {
        logger.debug(`Message received: ${event.name}`);

        try {
          const content = JSON.parse(brokeredMessage.body);
          
          const result = handler(content);
          const handlerResult = await (result instanceof Promise ? result : Promise.resolve(result));

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
          logger.error(`Error parsing or processing message for event ${event.name}:`, error);
          throw error; // This will cause the message to be abandoned
        }
      },
      processError: async (args) => {
        logger.error(`Error in message processing for ${event.name}:`, args.error);
      },
    });
  }

  /**
   * Close all senders, receivers, and the client connection
   */
  async close(): Promise<void> {
    try {
      // Close all senders
      await Promise.all(
        Array.from(this.senders.values()).map(sender => sender.close())
      );
      this.senders.clear();

      // Close all receivers
      await Promise.all(
        Array.from(this.receivers.values()).map(receiver => receiver.close())
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
