import type { CriterionData } from "@/plugins/data";
import type { StaticAnalysisConfig } from "@/plugins/static-analysis/config";
import type { CliOutput } from "@/plugins/static-analysis/semgrep-output";
import path from "node:path";
import process from "node:process";
import {
  getBlobNameParts,
  getBlobNameRest,
} from "@grading-system/utils/azure-storage-blob";
import { LocalCommandExecutor } from "@grading-system/utils/local-command";
import logger from "@grading-system/utils/logger";
import { errAsync, okAsync, Result, ResultAsync, safeTry } from "neverthrow";
import {
  downloadBlobBatch,
  IDENTIFIER_PATH_LEVELS,
  submissionStore,
} from "@/lib/blob-storage";
import { cleanTempDirectory, symlinkFiles } from "@/lib/file";
import { ErrorWithCriterionInfo } from "@/plugins/error";
import { rulesetMap, staticAnalysisConfigSchema } from "@/plugins/static-analysis/config";
import { getTypedConfig } from "@/services/config";

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

export function gradeSubmission(data: {
  attachments: string[];
  metadata: Record<string, unknown>;
  criterionDataList: CriterionData[];
  attemptId: string;
}) {
  return safeTry(async function* () {
    const allBlobNames = data.criterionDataList.flatMap(
      (criterionData) => criterionData.fileRefs,
    );

    const { downloadDir, blobNameRoot } = yield* downloadBlobBatch(
      submissionStore,
      allBlobNames,
      IDENTIFIER_PATH_LEVELS,
      `download-${data.attemptId}`,
    );

    const { rest: submissionRef } = getBlobNameParts(blobNameRoot);

    const symlinkPromises = data.criterionDataList.map((criterionData) => {
      const blobNameRestList = Result.combine(
        criterionData.fileRefs.map((blobName) => getBlobNameRest(blobName, blobNameRoot)),
      );

      if (blobNameRestList.isErr()) {
        return errAsync(
          new ErrorWithCriterionInfo({
            data: { criterionName: criterionData.criterionName },
            cause: blobNameRestList.error,
          }),
        );
      }

      const symlinkPromise = symlinkFiles(
        downloadDir,
        blobNameRestList.value,
        `download-${data.attemptId}-${criterionData.criterionName}`,
      );

      const configPromise = getTypedConfig(
        criterionData.configuration,
        staticAnalysisConfigSchema,
      );

      return ResultAsync.combine([symlinkPromise, configPromise])
        .map((value) => {
          return {
            criterionData,
            fileList: blobNameRestList.value,
            directory: value[0].path,
            config: value[1],
          };
        })
        .mapErr((error) => {
          logger.info(`internal: Failed to grade ${criterionData.criterionName}:`, error);

          return new ErrorWithCriterionInfo({
            data: { criterionName: criterionData.criterionName },
            cause: error,
          });
        });
    });

    logger.debug("info:", {
      submissionRef,
      blobNameRoot,
    });

    function toFileRef(filePath: string) {
      return path.join(submissionRef, filePath);
    }

    const gradeCriterionPromises = symlinkPromises.map((promise) =>
      promise.andThen((value) => {
        function clean() {
          cleanTempDirectory(value.directory).orTee((error) => {
            console.error(`Failed to clean temporary directory`, error);
          });
        }
        return gradeCriterion({
          attemptId: data.attemptId,
          criterionData: value.criterionData,
          fileList: value.fileList,
          directory: value.directory,
          config: value.config,
          stripFunc: (fullPath) => fullPath.replace(`${value.directory}/`, ""),
        })
          .mapErr((error) => {
            clean();
            return new ErrorWithCriterionInfo({
              data: { criterionName: value.criterionData.criterionName },
              message: `Failed to grade criterion ${value.criterionData.criterionName}`,
              cause: error,
            });
          })
          .map((gradeResult) => {
            clean();

            const scannedFilesSet = new Set(gradeResult.scannedFiles);
            const ignoredFiles = [];
            for (const filePath of value.fileList) {
              if (!scannedFilesSet.has(filePath)) {
                ignoredFiles.push(toFileRef(filePath));
              }
            }

            const result = {
              criterion: value.criterionData.criterionName,
              score: gradeResult.score,
              feedback: gradeResult.feedbacks.map((item) => ({
                ...item,
                fileRef: toFileRef(item.filePath),
              })),
              ignoredFiles,
            };

            logger.debug("Graded criterion result", result);

            return result;
          });
      }),
    );

    return okAsync(gradeCriterionPromises);
  });
}

const EXPERIMENTAL_MODE = process.env.SEMGREP_EXPERIMENTAL_MODE === "true";

export function gradeCriterion(data: {
  attemptId: string;
  criterionData: CriterionData;
  fileList: string[];
  directory: string;
  config: StaticAnalysisConfig;
  stripFunc: (filePath: string) => string;
}) {
  return safeTry(async function* () {
    const args = ["run", "semgrep", "scan", data.directory];

    if (EXPERIMENTAL_MODE) {
      args.push("--experimental");
    }

    if (data.config.crossFileAnalysis) {
      args.push("--pro");
    }

    args.push(...createRuleFlags(data.config));

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
          score -= data.config.deductionMap.critical;
          break;
        case "ERROR":
          score -= data.config.deductionMap.error;
          break;
        case "WARNING":
          score -= data.config.deductionMap.warning;
          break;
        case "INFO":
          score -= data.config.deductionMap.info;
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
