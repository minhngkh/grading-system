import type { ServiceActionPath } from "@grading-system/typed-moleculer/action";
import type { TypedServiceSchema } from "@grading-system/typed-moleculer/service";
import type { AIService } from "@/plugins/ai/service";
import type { StaticAnalysisService } from "@/plugins/static-analysis/service";
import { z } from "zod";
import { aiPluginOperations } from "@/plugins/ai/service";
import {
  baseStaticAnalysisConfigSchema,
  checkStaticAnalysisConfigSchema,
  staticAnalysisConfigSchema,
} from "@/plugins/static-analysis/config";
import { staticAnalysisPluginOperations } from "@/plugins/static-analysis/service";
import { testRunnerConfigSchema } from "@/plugins/test-runner/config";

type PluginOperation<T extends TypedServiceSchema> = {
  action: ServiceActionPath<T>;
};

export interface PluginOperations<T extends TypedServiceSchema>
  extends Record<string, PluginOperation<T> | undefined> {
  grade: PluginOperation<T>;
  config?: PluginOperation<T>;
}

export const plugins = {
  ai: {
    "~type": undefined as unknown as AIService,
    id: "ai",
    operations: aiPluginOperations,
    configSchema: null,
    checkConfig: undefined,
  },
  testRunner: {
    "~type": undefined as unknown as StaticAnalysisService,
    id: "test-runner",
    operations: staticAnalysisPluginOperations,
    configSchema: testRunnerConfigSchema,
    checkConfig: undefined,
  },
  staticAnalysis: {
    "~type": undefined as unknown as StaticAnalysisService,
    id: "static-analysis",
    operations: staticAnalysisPluginOperations,
    configSchema: staticAnalysisConfigSchema,
    checkConfig: checkStaticAnalysisConfigSchema,
  },
};

export const configurablePluginsMap = Object.entries(plugins).reduce(
  (acc, [key, value]) => {
    if (value.configSchema !== null) acc.set(value.id, key as keyof typeof plugins);
    return acc;
  },
  new Map<string, keyof typeof plugins>(),
);

export const pluginsMap = Object.entries(plugins).reduce((acc, [key, value]) => {
  acc.set(value.id, key as keyof typeof plugins);
  return acc;
}, new Map<string, keyof typeof plugins>());

export const pluginConfigSchema = z.discriminatedUnion("type", [
  testRunnerConfigSchema,
  baseStaticAnalysisConfigSchema,
]);
