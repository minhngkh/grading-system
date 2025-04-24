import type { Context, ServiceBroker } from "moleculer";
import { ZodParams, type ZodParamsOptionsType } from "moleculer-zod-validator";
import { z, type ZodRawShape } from "zod";

export interface Event<
  TName extends string, // to display exact event name instead of "string" when hover
  TShape extends ZodRawShape,
  TOptions extends ZodParamsOptionsType = ZodParamsOptionsType
> {
  name: TName;
  validate: ZodParams<TShape, TOptions>;
}

export function defineEvent<
  TName extends string,
  TShape extends ZodRawShape,
  TOptions extends ZodParamsOptionsType = ZodParamsOptionsType
>(
  name: TName,
  schema: TShape,
  options?: TOptions
): Event<TName, TShape, TOptions> {
  return {
    name,
    validate: new ZodParams(schema, options),
  };
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function emitEvent<E extends Event<any, any, any>>(
  broker: ServiceBroker | Context,
  event: E,
  data: E["validate"]["call"]
) {
  broker.emit(event.name, data);
}
