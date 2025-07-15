import type { ServiceActionPath } from "@grading-system/typed-moleculer/action";
import type { TypedServiceSchema } from "@grading-system/typed-moleculer/service";
import type { AIService } from "@/plugins/ai/service";
import type { StaticAnalysisService } from "@/plugins/static-analysis/service";
import { aiPluginOperations } from "@/plugins/ai/service";
import { staticAnalysisPluginOperations } from "@/plugins/static-analysis/service";

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
  },
  testRunner: {
    "~type": undefined as unknown as StaticAnalysisService,
    id: "test-runner",
    operations: staticAnalysisPluginOperations,
  },
  staticAnalysis: {
    "~type": undefined as unknown as StaticAnalysisService,
    id: "static-analysis",
    operations: staticAnalysisPluginOperations,
  },
};
