import CodeRunnerConfigView from "@/plugins/code-runner";
import StaticAnalysisConfigView from "@/plugins/static-analysis";
import { PluginComponent } from "@/plugins/type";

export const PluginName = {
  ai: "AI Grading",
  "test-runner": "Test Runner",
  "static-analysis": "Static Analysis",
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
  ai: {
    view: () => null,
    enableConfig: false,
  },
};
