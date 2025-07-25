import type { CriterionData } from "@/plugins/data";
import type { TestRunnerConfig } from "@/plugins/test-runner/config";
import type { GoJudge } from "@/plugins/test-runner/go-judge-api";
import path from "node:path";
import process from "node:process";
import {
  getBlobNameParts,
  getBlobNameRest,
} from "@grading-system/utils/azure-storage-blob";
import logger from "@grading-system/utils/logger";
import { zipFolderToBuffer } from "@grading-system/utils/zip";
import { errAsync, fromPromise, okAsync, Result, ResultAsync, safeTry } from "neverthrow";
import { z } from "zod";
import {
  downloadBlobBatch,
  IDENTIFIER_PATH_LEVELS,
  submissionStore,
} from "@/lib/blob-storage";
import { cache, CacheError } from "@/lib/cache";
import { EmptyListError } from "@/lib/error";
import { cleanTempDirectory, symlinkFiles } from "@/lib/file";
import { ErrorWithCriterionInfo } from "@/plugins/error";
import { testRunnerConfigSchema } from "@/plugins/test-runner/config";
import { prepareFile, runProgram } from "@/plugins/test-runner/go-judge";
import { getTypedConfig } from "@/services/config";

const FILE_STORE_PATH = process.env.GO_JUDGE_STORE_DIR!;

export const CALLBACK_STEP = {
  UPLOAD: "upload",
  INIT: "init",
  RUN: "run",
} as const;

export const testRunnerCallbackUrlSchema = z.object({
  type: z.enum(Object.values(CALLBACK_STEP) as [string, ...string[]]),
  id: z.string().describe("Unique identifier for the callback"),
});

export type CachedData = {
  config: CallData["config"];
  criterionData: CallData["criterionData"];
  state: (typeof CALLBACK_STEP)[keyof typeof CALLBACK_STEP];
  processed: number;
  total: number;
};

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
        testRunnerConfigSchema,
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

    const uploadSubmissionPromises = symlinkPromises.map((promise) =>
      promise.andThen((value) => {
        function clean() {
          cleanTempDirectory(value.directory).orTee((error) => {
            console.error(`Failed to clean temporary directory`, error);
          });
        }
        return uploadSubmission({
          attemptId: data.attemptId,
          criterionData: value.criterionData,
          fileList: value.fileList,
          directory: value.directory,
          config: value.config,
        }).mapErr((error) => {
          clean();
          return new ErrorWithCriterionInfo({
            data: { criterionName: value.criterionData.criterionName },
            message: error.message,
            cause: error,
          });
        });
      }),
    );

    return okAsync(uploadSubmissionPromises);
  });
}

const DEFAULT_LIMITATIONS = {
  cpuLimit: 10 * 1000000000, // 10s
  memoryLimit: 256 * 1024 * 1024, // 256MB
  procLimit: 50,
};

export type CallData = {
  attemptId: string;
  criterionData: CriterionData;
  config: TestRunnerConfig;
};

export function uploadSubmission(data: {
  attemptId: string;
  criterionData: CriterionData;
  fileList: string[];
  directory: string;
  config: TestRunnerConfig;
}) {
  return safeTry(async function* () {
    if (data.fileList.length === 0) {
      return errAsync(new EmptyListError({ message: "No files to run" }));
    }

    logger.debug("zipping folder", data.directory);
    const firstDir = data.fileList[0].split(path.sep)[0];

    const zipBuffer = yield* zipFolderToBuffer(data.directory);

    cleanTempDirectory(data.directory).orTee((error) => {
      logger.debug(`Failed to clean temporary directory`, error);
    });

    const fileId = yield* prepareFile(zipBuffer).map((value) => value.data);

    logger.debug("prepared file", fileId);

    const key = `test-runner:${data.attemptId}`;
    yield* fromPromise(
      cache
        .multi()
        // store the config (JSON‐stringified), initial state, and 0 accesses
        .hset(key, {
          config: data.config,
          criterionData: data.criterionData,
          state: CALLBACK_STEP.UPLOAD,
          processed: 0,
          total: data.config.testCases.length,
        } as CachedData)
        // make sure the list exists (optional—LPUSH then LTRIM could also work)
        .del(`${key}:results`)
        .exec(),
      (error) =>
        new CacheError({
          message: "Failed to initialize test runner state",
          cause: error,
        }),
    );

    yield* runProgram(
      {
        cmd: [
          {
            args: createArgs("unzip file.zip > /dev/null && rm file.zip && ls"),
            env: createEnv({}),
            files: createIOFiles({ stdout: true, stderr: true }),
            copyIn: {
              "file.zip": { fileId },
            },
            copyOutDir: createDirStorePath(data.attemptId),
            ...DEFAULT_LIMITATIONS,
          },
        ],
      },
      {
        id: data.attemptId,
        type: CALLBACK_STEP.UPLOAD,
      },
    );

    return okAsync();
  });
}

export function initializeSubmission(data: CallData) {
  return safeTry(async function* () {
    const config = data.config;
    const env = createEnv({
      env: config.environmentVariables,
    });

    if (config.initCommand) {
      logger.debug("Initializing project with initCommand", config.initCommand);

      yield* runProgram(
        {
          cmd: [
            {
              args: createArgs(config.initCommand),
              env,
              files: createIOFiles({ stdout: true, stderr: true }),
              copyIn: {
                ".": {
                  src: path.join(FILE_STORE_PATH, createDirStorePath(data.attemptId)),
                },
              },
              copyOutDir: createDirStorePath(data.attemptId),
              cpuLimit: config.advancedSettings.initStep.cpuLimit,
              clockLimit: config.advancedSettings.initStep.clockLimit,
              memoryLimit: config.advancedSettings.initStep.memoryLimit,
              procLimit: config.advancedSettings.initStep.procLimit,
            },
          ],
        },
        {
          id: data.attemptId,
          type: CALLBACK_STEP.INIT,
        },
      );

      return okAsync({ init: true });
    }

    // yield* runSubmission(data);

    return okAsync({ init: false });
  });
}

export function runSubmission(data: CallData) {
  return safeTry(async function* () {
    const config = data.config;
    const env = createEnv({
      env: config.environmentVariables,
    });
    logger.debug("run args", createArgs(config.runCommand));

    yield* runProgram(
      {
        cmd: data.config.testCases.map((testCase) => {
          return {
            args: createArgs(config.runCommand),
            env,
            files: createIOFiles({
              stdin: testCase.input,
              stdout: true,
              stderr: true,
            }),
            copyIn: {
              ".": {
                src: path.join(FILE_STORE_PATH, createDirStorePath(data.attemptId)),
              },
            },
            cpuLimit: config.advancedSettings.runStep.cpuLimit,
            clockLimit: config.advancedSettings.runStep.clockLimit,
            memoryLimit: config.advancedSettings.runStep.memoryLimit,
            procLimit: config.advancedSettings.runStep.procLimit,
          };
        }),
      },
      {
        id: data.attemptId,
        type: CALLBACK_STEP.RUN,
      },
    );

    return okAsync();
  });
}

function createArgs(command: string) {
  logger.debug("Creating command args", command);
  return ["sh", "-c", `rm stdout stderr &> /dev/null; ${command}`];
}

const DEFAULT_PATH = "/usr/bin:/bin";

function createEnv(options: { paths?: string[]; env?: Record<string, string> }) {
  return [
    `PATH=${[...(options.paths || []), DEFAULT_PATH].join(":")}`,
    ...Object.entries(options.env || {}).map(([key, value]) => `${key}=${value}`),
  ];
}

const OUTPUT_CAP = 1024 * 1024; // 1MB

function createIOFiles(options: { stdin?: string; stdout?: boolean; stderr?: boolean }) {
  const files: GoJudge.Cmd["files"] = [{ content: options.stdin || "" }];

  if (options.stdout) {
    files.push({ name: "stdout", max: OUTPUT_CAP });
  } else {
    files.push(null);
  }

  if (options.stderr) {
    files.push({ name: "stderr", max: OUTPUT_CAP });
  } else {
    files.push(null);
  }

  return files;
}

function createDirStorePath(attemptId: string) {
  return attemptId;
}

export function getCachedData(id: string) {
  return fromPromise(
    cache.hmget<Pick<CallData, "config" | "criterionData">>(
      `test-runner:${id}`,
      "config",
      "criterionData",
    ),
    (error) =>
      new CacheError({
        message: "Failed to get cached data",
        cause: error,
      }),
  ).andThen((data) => {
    if (data === null) {
      return errAsync(
        new CacheError({
          message: `No cached found for id: ${id}`,
        }),
      );
    }
    return okAsync({
      config: data.config,
      criterionData: data.criterionData,
    });
  });
}

export function compareOutput(
  expected: string,
  actual: string,
  config: TestRunnerConfig["outputComparison"],
): boolean {
  if (config.ignoreWhitespace) {
    expected = expected.replace(/\s+/g, " ").trim();
    actual = actual.replace(/\s+/g, " ").trim();
  }

  if (config.ignoreLineEndings) {
    expected = expected.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    actual = actual.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  if (config.trim) {
    expected = expected.trim();
    actual = actual.trim();
  }

  if (config.ignoreCase) {
    expected = expected.toLowerCase();
    actual = actual.toLowerCase();
  }

  return expected === actual;
}
