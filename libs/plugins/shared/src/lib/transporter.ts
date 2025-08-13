import type { EventTransporter } from "@grading-system/utils/event-transporter/core";
import type { BrokerOptions } from "moleculer";
import process from "node:process";
import {
  createNonValidatedServiceBroker,
  createZodValidatedServiceBroker,
} from "@grading-system/typed-moleculer/service";
import { wrapError } from "@grading-system/utils/error";
import { AzureServiceBusTransporter } from "@grading-system/utils/event-transporter/azure-service-bus";
import { RabbitMQTransporter } from "@grading-system/utils/event-transporter/rabbitmq";
import { defaultTransformer } from "@grading-system/utils/event-transporter/transformers/default";
import { masstransitTransformer } from "@grading-system/utils/event-transporter/transformers/masstransit";

const CONNECTION_STRING = process.env.ConnectionStrings__messaging as string;
const USE_SERVICE_BUS = process.env.USE_SERVICE_BUS === "true";

let transporter: EventTransporter;

export async function getTransporter() {
  let result;
  if (!transporter) {
    if (USE_SERVICE_BUS) {
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

export function createMoleculerBroker(options?: {
  localOnly?: boolean;
  withZodValidation?: boolean;
  internal: Omit<BrokerOptions, "transporter">;
}) {
  const actualCreateOptions = {
    localOnly: options?.localOnly ?? false,
    withZodValidation: options?.withZodValidation ?? true,
  };

  const brokerOptions: BrokerOptions = options?.internal ?? {};

  if (!actualCreateOptions.localOnly) {
    if (USE_SERVICE_BUS) {
      throw new Error("Service Bus is not supported to use with Moleculer broker");
    }

    brokerOptions.transporter = CONNECTION_STRING;
  }

  if (actualCreateOptions.withZodValidation) {
    return createZodValidatedServiceBroker(brokerOptions);
  } else {
    return createNonValidatedServiceBroker(brokerOptions);
  }
}
