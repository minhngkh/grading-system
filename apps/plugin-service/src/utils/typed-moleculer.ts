// TODO: Move all moleculer stuff to libs/

import type { Event } from "@/utils/events";
import type {
  ActionSchema,
  BrokerOptions,
  Context,
  Service,
  ServiceActionsSchema,
  ServiceEvent,
  ServiceEventHandler,
  ServiceMethods,
  ServiceSchema,
  ServiceSettingSchema,
} from "moleculer";
import type { CustomOmit } from "./typescript";
import { ServiceBroker } from "moleculer";
import { ZodValidator } from "moleculer-zod-validator";

type TypedServiceActionsSchema<
  TMethods extends ServiceMethods = ServiceMethods,
  S = ServiceSettingSchema,
> = {
  [key: string]: ActionSchema;
} & ThisType<Service<S> & TMethods>;

type TypedServiceEvents<
  TMethods extends ServiceMethods = ServiceMethods,
  S = ServiceSettingSchema,
> = {
  [key: string]: ServiceEventHandler | ServiceEvent;
} & ThisType<Service<S> & TMethods>;

type TypedService<
  TMethods extends ServiceMethods,
  S = ServiceSettingSchema,
> = Service<S> & TMethods;

export interface _TypedServiceSchemaOld<
  TMethods extends ServiceMethods = ServiceMethods,
  S = ServiceSettingSchema,
> extends ServiceSchema<S, TypedService<TMethods, S>> {
  actions?: TypedServiceActionsSchema<TMethods>;
  events?: TypedServiceEvents<TMethods>;
  methods?: TMethods;
}

export interface TypedServiceSchema<
  TMethods extends ServiceMethods = ServiceMethods,
  TActions extends
    TypedServiceActionsSchema<TMethods> = TypedServiceActionsSchema<TMethods>,
  S = ServiceSettingSchema,
> extends ServiceSchema<S, TypedService<TMethods, S>> {
  actions?: TActions;
  events?: TypedServiceEvents<TMethods>;
  methods?: TMethods;
}

interface ServiceInterface {
  methods?: ServiceMethods;
  actions?: ServiceActionsSchema;
}

export type TypedServiceInterface<T extends ServiceInterface> =
  _TypedServiceSchemaOld<
    T["methods"] extends ServiceMethods ? T["methods"] : ServiceMethods
  >;

export function defineTypedService<
  TName extends string,
  TMethods extends ServiceMethods,
>(
  name: TName,
  schema: CustomOmit<_TypedServiceSchemaOld<TMethods>, "name">,
): _TypedServiceSchemaOld<TMethods> & { name: TName } {
  return {
    ...schema,
    name,
  };
}

export function defineTypedService2<
  TName extends string,
  TMethods extends ServiceMethods,
  TActions extends TypedServiceActionsSchema<TMethods>,
>(
  name: TName,
  schema: CustomOmit<TypedServiceSchema<TMethods, TActions>, "name">,
): TypedServiceSchema<TMethods, TActions> & { name: TName } {
  return {
    ...schema,
    name,
  };
}

export type InferTypedService<T> =
  T extends _TypedServiceSchemaOld<infer M, infer S> ? TypedService<M, S>
  : never;

export function subscribeToEvent<
  T extends _TypedServiceSchemaOld | null = null,
>(
  event: Event<any, any>,
  handlerFunc: (
    this: T extends null ? Service : T,
    ctx: Context<typeof event.validate.context>,
  ) => void | Promise<void>,
): ServiceEventHandler | ServiceEvent {
  return {
    params: event.validate.schema,
    handler: handlerFunc,
  };
}

type EventHandler<E extends Event<any, any>, T extends Service> = (
  this: T,
  ctx: Context<E["validate"]["context"]>,
) => void | Promise<void>;

export function defineEventHandler<
  E extends Event<any, any>,
  T extends Service,
>(
  event: E,
  handlerFunc: EventHandler<E, T>,
): ServiceEventHandler | ServiceEvent {
  return {
    params: event.validate.schema,
    handler: handlerFunc,
  };
}

export function createZodValidatedServiceBroker(options?: BrokerOptions) {
  return new ServiceBroker({
    ...options,
    validator: new ZodValidator(),
  });
}

export function createNonValidatedServiceBroker(options?: BrokerOptions) {
  return new ServiceBroker({
    ...options,
    validator: false,
  });
}

// TODO: extends ServiceBroker instead of creating custom emit and call functions?
