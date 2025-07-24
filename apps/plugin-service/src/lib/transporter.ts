import type { EventTransporter } from "@grading-system/utils/event-transporter/core";
import process from "node:process";
import { AzureServiceBusTransporter } from "@grading-system/utils/event-transporter/azure-service-bus";
import { defaultTransformer } from "@grading-system/utils/event-transporter/transformers/default";

const CONNECTION_STRING = process.env.ConnectionStrings__messaging as string;

let transporter: EventTransporter;

export async function getTransporter() {
  if (!transporter) {
    const result = await AzureServiceBusTransporter.create({
      connectionString: CONNECTION_STRING,
      transformer: defaultTransformer(),
    });

    if (result.isErr()) {
      throw new Error(`Failed to create Azure Service Bus transporter`);
    }

    transporter = result.value;
  }

  return transporter;
}
