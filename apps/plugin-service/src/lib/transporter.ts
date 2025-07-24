import type { EventTransporter } from "@grading-system/utils/event-transporter/core";
import process from "node:process";
import { AzureServiceBusTransporter } from "@grading-system/utils/event-transporter/azure-service-bus";
import { RabbitMQTransporter } from "@grading-system/utils/event-transporter/rabbitmq";
import { defaultTransformer } from "@grading-system/utils/event-transporter/transformers/default";
import { masstransitTransformer } from "@grading-system/utils/event-transporter/transformers/masstransit";

const CONNECTION_STRING = process.env.ConnectionStrings__messaging as string;

let transporter: EventTransporter;

export async function getTransporter() {
  if (!transporter) {
    const result = await RabbitMQTransporter.create({
      connectionString: CONNECTION_STRING,
      transformer: masstransitTransformer(),
    });

    if (result.isErr()) {
      throw new Error(`Failed to create RabbitMQ transporter`);
    }

    transporter = result.value;
  }

  return transporter;
}
