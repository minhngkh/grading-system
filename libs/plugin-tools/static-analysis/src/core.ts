import type { CriterionData } from "@grading-system/plugin-shared/plugin/data";
import type { StaticAnalysisConfig } from "./config";
import type { CliOutput } from "./semgrep-output";
import path from "node:path";
import process from "node:process";
import { defaultGradeSubmissionFunc } from "@grading-system/plugin-shared/plugin/default";
import { LocalCommandExecutor } from "@grading-system/utils/local-command";
import logger from "@grading-system/utils/logger";
import { okAsync, safeTry } from "neverthrow";
import { rulesetMap } from "./config";

const workspaceRoot = path.join(process.cwd(), "..", "..");
const pluginToolProjectPath = path.join(
  workspaceRoot,
  "libs",
  "plugin-tools",
  "static-analysis",
);
const pluginToolPath = "uv";

const tool = new LocalCommandExecutor({
  path: pluginToolPath,
});

const EXPERIMENTAL_MODE = process.env.SEMGREP_EXPERIMENTAL_MODE === "true";

export const gradeSubmission = defaultGradeSubmissionFunc(
  gradeCriterion,
  (result, toFileRef) => {
    const scannedFilesSet = new Set(result.scannedFiles);
    const ignoredFiles = [];
    for (const filePath of value.fileList) {
      if (!scannedFilesSet.has(filePath)) {
        ignoredFiles.push(toFileRef(filePath));
      }
    }
  },
);

export function gradeCriterion(data: {
  attemptId: string;
  criterionData: CriterionData<StaticAnalysisConfig>;
  fileList: string[];
  directory: string;
  stripFunc: (filePath: string) => string;
}) {
  return safeTry(async function* () {
    const config = data.criterionData.configuration;

    const args = ["run", "semgrep", "scan", data.directory];

    if (EXPERIMENTAL_MODE) {
      args.push("--experimental");
    }

    if (config.crossFileAnalysis) {
      args.push("--pro");
    }

    args.push(...createRuleFlags(config));

    args.push("--json", "--quiet");

    const execResult = yield* tool.execute(args, {
      cwd: pluginToolProjectPath,
      // cwd: data.directory,
    });

    const { results, paths } = JSON.parse(execResult.stdout) as CliOutput;

    let score = 100;
    for (const result of results) {
      const severity = result.extra.severity;

      switch (severity) {
        case "CRITICAL":
          score -= config.deductionMap.critical;
          break;
        case "ERROR":
          score -= config.deductionMap.error;
          break;
        case "WARNING":
          score -= config.deductionMap.warning;
          break;
        case "INFO":
          score -= config.deductionMap.info;
          break;
      }
    }

    score = Math.max(score, 0);
    const feedbacks = results.map((result) => {
      const position = {
        fromLine: result.start.line,
        fromCol: result.start.col,
        toLine: result.end.line,
        toCol: result.end.col,
      };
      const message = result.extra.message || undefined;

      return {
        filePath: data.stripFunc(result.path),
        position,
        severity: result.extra.severity,
        message,
      };
    });

    return okAsync({
      score,
      feedbacks,
      scannedFiles: paths.scanned.map(data.stripFunc),
    });
  });
}

function createRuleFlags(config: StaticAnalysisConfig) {
  const flags = [];
  if (config.preset) {
    if (config.preset.type === "auto") {
      flags.push("--config=auto");
    } else {
      flags.push(
        ...rulesetMap[config.preset.type].map((ruleset) => `--config=${ruleset}`),
      );
    }
  }

  if (config.additionalRulesets) {
    for (const ruleset of config.additionalRulesets) {
      flags.push(`--config=${ruleset}`);
    }
  }

  logger.debug("Semgrep flags:", flags);

  return flags;
}
