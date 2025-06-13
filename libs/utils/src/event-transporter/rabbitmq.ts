import type { Result, ResultAsync } from "neverthrow";
import type { z } from "zod";
import type { EventTransformer, ServiceEvent } from "@/event-transporter/core";
import { Buffer } from "node:buffer";
import process from "node:process";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import amqp from "amqplib";
import { errAsync, fromPromise, fromThrowable, okAsync } from "neverthrow";
import { EventTransporter } from "@/event-transporter/core";

const CONNECTION_STRING = process.env.ConnectionStrings__messaging as string;

let channel: amqp.ConfirmChannel | undefined;

async function getChannel() {
  if (channel) {
    return channel;
  }

  try {
    const connection = await amqp.connect(CONNECTION_STRING);
    channel = await connection.createConfirmChannel();
    logger.info("Connected to RabbitMQ");

    return channel;
  } catch (error) {
    throw wrapError(asError(error), "Failed to connect to RabbitMQ");
  }
}

export async function createEventConsumer<T extends z.ZodObject<any, any, any>>(
  event: ServiceEvent<T>,
) {
  const channel = await getChannel();
  await Promise.all([
    channel.assertExchange(event.name, "fanout", { durable: true }),
    channel
      .assertQueue(event.name, { durable: true })
      .then(() => channel.bindQueue(event.name, event.name, "")),
  ]);

  return {
    /**
     * Consumes messages from the event queue.
     * @param callback A function to process the message data. Error will results in the message being rejected.
     */
    consume: (
      callback: (
        data: z.infer<typeof event.schema>,
      ) => Result<unknown, unknown> | ResultAsync<unknown, unknown>,
    ) => {
      return channel.consume(event.name, async (message) => {
        if (message !== null) {
          const content = message.content.toString();

          try {
            const data = event.schema.parse(JSON.parse(content).message);
            const result = await callback(data);
            if (result.isErr()) {
              throw result.error;
            }

            channel.ack(message);
          } catch (err) {
            const error = asError(err);
            logger.error("Error processing message:", error);
            channel.nack(message, false, false);
          }
        } else {
          logger.info("Received null message");
        }
      });
    },
  };
}

export async function createEventEmitter<T extends z.ZodObject<any, any, any>>(
  event: ServiceEvent<T>,
) {
  const channel = await getChannel();

  await channel.assertExchange(event.name, "fanout", { durable: true });

  return {
    emit(
      data: z.infer<typeof event.schema>,
      resultCallback?: (isError: boolean) => void,
    ) {
      const wrappedData = Buffer.from(JSON.stringify(data));
      return channel.publish(
        event.name,
        "",
        wrappedData,
        {
          contentType: "application/json",
        },
        (err) => {
          if (err) {
            logger.error(`Failed to publish message: ${event.name}`);
            resultCallback?.(true);
          } else {
            logger.debug(`Message published successfully: ${event.name}`);
            resultCallback?.(false);
          }
        },
      );
    },
  };
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

  private static new(options: {
    transformer: EventTransformer;
    connectionString: string;
  }) {
    return fromPromise(getChannel(), (error) =>
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
          logger.error(`Failed to publish message: ${event.name}`, err);
          callback?.(true);
          return;
        }

        logger.debug(`Message published successfully: ${event.name}`);
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

      const content = msg.content.toString();

      handler(content).match(
        () => {
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
