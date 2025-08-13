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
  hasDefault: boolean;
};

export const PluginConfigDialogs: Record<string, PluginInfo> = {
  "test-runner": {
    view: CodeRunnerConfigView,
    enableConfig: true,
    hasDefault: false,
  },
  "static-analysis": {
    view: StaticAnalysisConfigView,
    enableConfig: true,
    hasDefault: false,
  },
  "type-coverage": {
    view: TypeCoverageConfigView,
    enableConfig: true,
    hasDefault: true,
  },
  ai: {
    view: AIConfigView,
    enableConfig: true,
    hasDefault: true,
  },
};
