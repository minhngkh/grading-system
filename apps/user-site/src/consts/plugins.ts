import type { PluginComponent } from "@/plugins/type";
import AIConfigView from "@/plugins/ai";
import CodeRunnerConfigView from "@/plugins/code-runner";
import StaticAnalysisConfigView from "@/plugins/static-analysis";
import TypeCoverageConfigView from "@/plugins/type-coverage";

export const PluginName = {
  ai: "AI Grader",
  "test-runner": "Test Runner",
  "static-analysis": "Static Analysis",
  "type-coverage": "Type Coverage",
  None: "Manual Grading",
} as const;

type PluginInfo = {
  view: PluginComponent;
  enableConfig: boolean;
};

export const PluginConfigDialogs: Record<string, PluginInfo> = {
  "test-runner": {
    view: CodeRunnerConfigView,
    enableConfig: true,
  },
  "static-analysis": {
    view: StaticAnalysisConfigView,
    enableConfig: true,
  },
  "type-coverage": {
    view: TypeCoverageConfigView,
    enableConfig: true,
  },
  ai: {
    view: AIConfigView,
    enableConfig: true,
  },
};
