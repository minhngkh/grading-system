import type {
  ActionHandler,
  ActionSchema,
  Context,
  Service,
  ServiceActionsSchema,
  ServiceEvent,
  ServiceEventHandler,
  ServiceMethods,
  ServiceSchema,
  ServiceSettingSchema,
} from "moleculer";

import type { Event } from "./events";

type TypedServiceActionsSchema<
  TMethods extends ServiceMethods = ServiceMethods,
  S = ServiceSettingSchema
> = {
  [key: string]: ActionSchema | ActionHandler | boolean;
} & ThisType<Service<S> & TMethods>;

type TypedServiceEvents<
  TMethods extends ServiceMethods = ServiceMethods,
  S = ServiceSettingSchema
> = {
  [key: string]: ServiceEventHandler | ServiceEvent;
} & ThisType<Service<S> & TMethods>;

type TypedService<
  TMethods extends ServiceMethods,
  S = ServiceSettingSchema
> = Service<S> & TMethods;

interface TypedServiceSchema<
  TMethods extends ServiceMethods = ServiceMethods,
  S = ServiceSettingSchema
> extends ServiceSchema<S, TypedService<TMethods, S>> {
  actions?: TypedServiceActionsSchema<TMethods>;
  events?: TypedServiceEvents<TMethods>;
  methods?: TMethods;
}

interface ServiceInterface {
  methods?: ServiceMethods;
  actions?: ServiceActionsSchema;
}

export type TypedServiceInterface<T extends ServiceInterface> =
  TypedServiceSchema<
    T["methods"] extends ServiceMethods ? T["methods"] : ServiceMethods
  >;

export function defineTypedService<TMethods extends ServiceMethods>(
  schema: TypedServiceSchema<TMethods>
): TypedServiceSchema<TMethods> {
  return schema;
}

export type InferTypedService<T> = T extends TypedServiceSchema<
  infer M,
  infer S
>
  ? TypedService<M, S>
  : never;

export function subscribeToEvent<T extends TypedServiceSchema | null = null>(
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  event: Event<any, any>,
  handlerFunc: (
    this: T extends null ? Service : T,
    ctx: Context<typeof event.validate.context>
  ) => void | Promise<void>
): ServiceEventHandler | ServiceEvent {
  return {
    params: event.validate.schema,
    handler: handlerFunc,
  };
}

type EventHandlerV0<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  E extends Event<any, any>,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  T extends TypedServiceSchema<any, any> | null = null
> = (
  this: T extends null ? Service : InferTypedService<T>,
  ctx: Context<E["validate"]["context"]>
) => void | Promise<void>;

function defineEventHandlerV0<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  E extends Event<any, any>,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  T extends TypedServiceSchema<any, any> | null = null
>(
  event: E,
  handlerFunc: EventHandlerV0<E, T>
): ServiceEventHandler | ServiceEvent {
  return {
    params: event.validate.schema,
    handler: handlerFunc,
  };
}

type EventHandler<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  E extends Event<any, any>,
  T extends Service
> = (
  this: T,
  ctx: Context<E["validate"]["context"]>
) => void | Promise<void>;

export function defineEventHandler<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  E extends Event<any, any>,
  T extends Service
>(
  event: E,
  handlerFunc: EventHandler<E, T>
): ServiceEventHandler | ServiceEvent {
  return {
    params: event.validate.schema,
    handler: handlerFunc,
  };
}
