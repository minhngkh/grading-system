import type { Result, ResultAsync } from "neverthrow";
import type { z } from "zod";
import type { EventTransformer, ServiceEvent } from "@/event-transporter/core";
import { Buffer } from "node:buffer";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import amqp from "amqplib";
import { fromPromise } from "neverthrow";
import { EventTransporter } from "@/event-transporter/core";

async function getChannel(connectionString: string) {
  try {
    const connection = await amqp.connect(connectionString);
    const channel = await connection.createConfirmChannel();
    logger.info("Connected to RabbitMQ");

    return channel;
  } catch (error) {
    throw wrapError(asError(error), "Failed to connect to RabbitMQ");
  }
}

export class RabbitMQTransporter extends EventTransporter {
  private channel: amqp.ConfirmChannel;
  private validIncomingExchange: Set<string> = new Set();
  private validOutgoingExchange: Set<string> = new Set();

  private constructor(options: {
    transformer: EventTransformer;
    channel: amqp.ConfirmChannel;
  }) {
    super(options);
    this.channel = options.channel;
  }

  static create(options: { transformer: EventTransformer; connectionString: string }) {
    return fromPromise(getChannel(options.connectionString), (error) =>
      wrapError(asError(error), "Failed to create RabbitMQ channel"),
    ).map((channel) => {
      return new RabbitMQTransporter({
        transformer: options.transformer,
        channel,
      });
    });
  }

  protected override async doEmit<T extends z.ZodType>(
    event: ServiceEvent<T>,
    data: z.infer<T>,
    callback?: (isError: boolean) => void,
  ): Promise<void> {
    if (!this.validOutgoingExchange.has(event.name)) {
      await this.channel.assertExchange(event.name, "fanout", { durable: true });
      this.validOutgoingExchange.add(event.name);
    }

    const buf = Buffer.from(JSON.stringify(data));

    this.channel.publish(
      event.name,
      "",
      buf,
      {
        contentType: "application/json",
      },
      (err) => {
        if (err) {
          logger.info(`Failed to publish message: ${event.name}`, err);
          callback?.(true);
          return;
        }

        logger.info(`Message published successfully: ${event.name}`);
        callback?.(false);
      },
    );
  }

  protected override async doConsume<T extends z.ZodType>(
    event: ServiceEvent<T>,
    handler: (
      data: z.infer<T>,
    ) => Result<unknown, unknown> | ResultAsync<unknown, unknown>,
  ): Promise<void> {
    if (!this.validIncomingExchange.has(event.name)) {
      await Promise.all([
        this.channel.assertExchange(event.name, "fanout", { durable: true }),
        this.channel
          .assertQueue(event.name, { durable: true })
          .then(() => this.channel.bindQueue(event.name, event.name, "")),
      ]);

      this.validIncomingExchange.add(event.name);
    }

    this.channel.consume(event.name, (msg) => {
      if (msg === null) {
        logger.info("Received null message");
        return;
      }

      logger.debug(`Message received: ${event.name}`);

      const content = msg.content.toString();

      handler(content).match(
        () => {
          logger.debug(`Message processed successfully: ${event.name}`);
          this.channel.ack(msg);
        },
        (error) => {
          logger.error(`Error processing message for event ${event.name}:`, error);
          this.channel.nack(msg, false, false);
        },
      );
    });
  }
}
