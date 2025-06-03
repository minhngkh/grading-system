import type { z } from "zod";
import type { ServiceEvent } from "@/types/event";
import { Buffer } from "node:buffer";
import process from "node:process";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import amqp from "amqplib";

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
    consume: (callback: (data: z.infer<typeof event.schema>) => Promise<void> | void) => {
      return channel.consume(event.name, (message) => {
        if (message !== null) {
          const content = message.content.toString();
          try {
            channel.ack(message); // Acknowledge the message
            const data = event.schema.parse(JSON.parse(content).message);

            callback(data);
            // channel.ack(message); // Acknowledge the message
          } catch (error) {
            logger.error("Error processing message:", error);
            // channel.nack(message); // Reject the message
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
      return channel.publish(event.name, "", wrappedData, {
        contentType: "application/json",
      }, (err, ok) => {
        if (err) {
          logger.error(`Failed to publish message: ${event.name}`);
          resultCallback?.(true);
        } else {
          logger.debug(`Message published successfully: ${event.name}`);
          resultCallback?.(false);
        }
      });
    },
  };
}
