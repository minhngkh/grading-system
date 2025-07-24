import type { ServiceActionPath } from "@grading-system/typed-moleculer/action";
import type { TypedServiceSchema } from "@grading-system/typed-moleculer/service";
import type { AIService } from "@/plugins/ai/service";
import type { StaticAnalysisService } from "@/plugins/static-analysis/service";
import type { TestRunnerService } from "@/plugins/test-runner/service";
import type { TypeCoverageService } from "@/plugins/type-coverage/service";
import { z } from "zod";
import { aiPluginOperations } from "@/plugins/ai/service";
import {
  baseStaticAnalysisConfigSchema,
  checkStaticAnalysisConfigSchema,
  staticAnalysisConfigSchema,
} from "@/plugins/static-analysis/config";
import { staticAnalysisPluginOperations } from "@/plugins/static-analysis/service";
import { testRunnerConfigSchema } from "@/plugins/test-runner/config";
import { testRunnerPluginOperations } from "@/plugins/test-runner/service";
import { typeCoverageConfigSchema } from "@/plugins/type-coverage/config";
import { typeCoveragePluginOperations } from "@/plugins/type-coverage/service";

type PluginOperation<T extends TypedServiceSchema> = {
  action: ServiceActionPath<T>;
};

export interface PluginOperations<T extends TypedServiceSchema>
  extends Record<string, PluginOperation<T> | undefined> {
  grade: PluginOperation<T>;
  config?: PluginOperation<T>;
}

export const CATEGORIES = [
  {
    id: "general",
    name: "General",
    description: "General purpose plugins",
  },
  {
    id: "ai",
    name: "AI",
    description: "Plugins utilizing AI models",
  },
  {
    id: "code",
    name: "Code",
    description: "Code related plugins",
  },
] as const;

export const plugins = {
  ai: {
    "~type": undefined as unknown as AIService,
    id: "ai",
    name: "AI grader",
    description: "Grade rubric using AI language models",
    categories: ["ai", "general"],
    enabled: true,
    operations: aiPluginOperations,
    configSchema: null,
    checkConfig: undefined,
  },
  testRunner: {
    "~type": undefined as unknown as TestRunnerService,
    id: "test-runner",
    name: "Test Runner",
    description: "Run tests on submissions",
    categories: ["code"],
    enabled: false,
    operations: testRunnerPluginOperations,
    configSchema: testRunnerConfigSchema,
    checkConfig: undefined,
  },
  staticAnalysis: {
    "~type": undefined as unknown as StaticAnalysisService,
    id: "static-analysis",
    name: "Static Analysis",
    description: "Using Semgrep to run static analysis on submissions",
    categories: ["code"],
    enabled: true,
    operations: staticAnalysisPluginOperations,
    configSchema: staticAnalysisConfigSchema,
    checkConfig: checkStaticAnalysisConfigSchema,
  },
  typeCoverage: {
    "~type": undefined as unknown as TypeCoverageService,
    id: "type-coverage",
    name: "Type Coverage",
    description: "Check type coverage in TypeScript projects",
    categories: ["code"],
    enabled: true,
    operations: typeCoveragePluginOperations,
    configSchema: typeCoverageConfigSchema,
    checkConfig: undefined,
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
  typeCoverageConfigSchema,
]);
