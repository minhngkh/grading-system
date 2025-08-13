import type { ServiceActionPath } from "@grading-system/typed-moleculer/action";
import type { TypedServiceSchema } from "@grading-system/typed-moleculer/service";

type PluginOperation<T extends TypedServiceSchema> = {
  action: ServiceActionPath<T>;
};

export interface PluginOperations<T extends TypedServiceSchema>
  extends Record<string, PluginOperation<T> | undefined> {
  grade: PluginOperation<T>;
  config?: PluginOperation<T>;
}