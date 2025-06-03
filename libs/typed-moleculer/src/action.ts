import type { IfAny } from "@grading-system/utils/typescript";
import type { Context, ServiceBroker } from "moleculer";
import type { TypedServiceSchema } from "./service";

// Helper type to extract specific action types from any service
export type GetServiceActionTypes<T extends TypedServiceSchema> =
  T["actions"] extends (
    infer Actions | undefined // Handle potential undefined
  ) ?
    Actions extends (
      object // Ensure Actions is an object
    ) ?
      {
        // Map over all keys of Actions
        [K in keyof Actions as string extends K ? never
        : number extends K ? never
        : // Keep the key if it's a specific literal key
          K]: Actions[K]; // Filter out keys that are 'string' or 'number' (index signatures) // Keep the original value type
      }
    : never // Not an object
  : never; // Was undefined

// Helper type to extract params and return types from action handlers
export type ServiceActionParams<TService extends TypedServiceSchema> = {
  [K in keyof GetServiceActionTypes<TService>]: GetServiceActionTypes<TService>[K] extends (
    { handler: infer H }
  ) ?
    H extends (ctx: Context<infer C>) => infer R ?
      {
        paramsType: C;
        returnType: R;
      }
    : never
  : never;
};


// TODO: Handle the case where version is string -> no v in front
export type ServiceActionPath<TService extends TypedServiceSchema> =
  TService["version"] extends undefined ?
    `${TService["name"]}.${keyof GetServiceActionTypes<TService> & string}`
  : `v${TService["version"]}.${TService["name"]}.${keyof GetServiceActionTypes<TService> &
      string}`;

type ExtractActionName<
  TService extends TypedServiceSchema<any, any>,
  TPath extends string, // Use string here, constraint is on TPath in emitEvent
> =
  TPath extends (
    | `${TService["name"]}.${infer ActionName}`
    | `v${TService["version"]}.${TService["name"]}.${infer ActionName}`
  ) ?
    ActionName extends keyof GetServiceActionTypes<TService> ?
      ActionName
    : never
  : never;


// TODO: Rewrite all this shenanigans
export function actionCaller<TService extends TypedServiceSchema>() {
  // This inner function now only needs to infer K
  return <
    TPath extends ServiceActionPath<TService>,
    TName extends ExtractActionName<TService, TPath> = ExtractActionName<TService, TPath>,
    TSignature extends
      ServiceActionParams<TService>[TName] = ServiceActionParams<TService>[TName],
  >(
    broker: ServiceBroker | Context,
    action: TPath, // Use K directly here for better inference link
    ...args: IfAny<TSignature["paramsType"], [], [params: TSignature["paramsType"]]>
  ): TSignature["returnType"] => {
    // Extract params from args tuple
    const params = args[0];
    // Call the underlying implementation or broker directly
    return broker.call(action, params) as TSignature["returnType"];
  };
}

// createServiceEmitter<PluginServiceType>()(
//   new ServiceBroker(),
//   "plugin.createRubric",
//   {
//     prompt: "test",
//     scoreInRange: true,
//   },
// );
