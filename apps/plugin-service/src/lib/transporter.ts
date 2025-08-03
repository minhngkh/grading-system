import type { EventTransporter } from "@grading-system/utils/event-transporter/core";
import process from "node:process";
import { wrapError } from "@grading-system/utils/error";
import { AzureServiceBusTransporter } from "@grading-system/utils/event-transporter/azure-service-bus";
import { RabbitMQTransporter } from "@grading-system/utils/event-transporter/rabbitmq";
import { defaultTransformer } from "@grading-system/utils/event-transporter/transformers/default";
import { masstransitTransformer } from "@grading-system/utils/event-transporter/transformers/masstransit";

const CONNECTION_STRING = process.env.ConnectionStrings__messaging as string;

let transporter: EventTransporter;

export async function getTransporter() {
  let result;
  if (!transporter) {
    if (process.env.USE_SERVICE_BUS === "true") {
      result = await AzureServiceBusTransporter.create({
        connectionString: CONNECTION_STRING,
        transformer: defaultTransformer(),
      });
    } else {
      result = await RabbitMQTransporter.create({
        connectionString: CONNECTION_STRING,
        transformer: masstransitTransformer(),
      });
    }

    if (result.isErr()) {
      throw wrapError(result.error, "Failed to create transporter");
    }

    transporter = result.value;
  }

  return transporter;
}
