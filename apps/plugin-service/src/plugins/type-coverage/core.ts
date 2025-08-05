import type { CriterionData } from "@/plugins/data";
import type { TypeCoverageConfig } from "@/plugins/type-coverage/config";
import { readdir } from "node:fs/promises";
import path from "node:path";
import {
  getBlobNameParts,
  getBlobNameRest,
} from "@grading-system/utils/azure-storage-blob";
import { asError, DefaultError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { errAsync, fromPromise, okAsync, Result, ResultAsync, safeTry } from "neverthrow";
import { lint } from "type-coverage-core";
import {
  downloadBlobBatch,
  IDENTIFIER_PATH_LEVELS,
  submissionStore,
} from "@/lib/blob-storage";
import { cleanTempDirectory, symlinkFiles } from "@/lib/file";
import { ErrorWithCriterionInfo } from "@/plugins/error";
import { typeCoverageConfigSchema } from "@/plugins/type-coverage/config";
import { getTypedConfig } from "@/services/config";

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
        typeCoverageConfigSchema,
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
              message: error.message,
              cause: error,
            });
          })
          .map((gradeResult) => {
            clean();
            const result = {
              criterion: value.criterionData.criterionName,
              score: gradeResult.score,
              message: gradeResult.message,
            };

            logger.debug("Graded criterion result", result);

            return result;
          });
      }),
    );

    return okAsync(gradeCriterionPromises);
  });
}

export function gradeCriterion(data: {
  attemptId: string;
  criterionData: CriterionData;
  fileList: string[];
  directory: string;
  config: TypeCoverageConfig;
  stripFunc: (filePath: string) => string;
}) {
  return safeTry(async function* () {
    const directoryContents = yield* fromPromise(
      readdir(data.directory, { withFileTypes: true }),
      (e) =>
        new DefaultError({
          message: `Failed to read directory ${data.directory}`,
        }),
    );

    // Check for tsconfig files in the root directory
    const rootTsconfigFiles = directoryContents
      .filter((item) => item.isFile() && /^tsconfig(?:\..*)?\.json$/.test(item.name))
      .map((item) => ({ name: item.name, directory: data.directory }));

    // Check for tsconfig files in first-level child directories
    const childDirectories = directoryContents.filter((item) => item.isDirectory());
    const childTsconfigFiles = [];

    for (const childDir of childDirectories) {
      const childPath = path.join(data.directory, childDir.name);
      const childContents = await fromPromise(readdir(childPath), (e) => {
        logger.debug(`Failed to read child directory ${childPath}: ${e}`);
        return new DefaultError({
          message: `Failed to read child directory ${childPath}`,
        });
      });

      if (childContents.isOk()) {
        const childTsconfigs = childContents.value
          .filter((file) => /^tsconfig(?:\..*)?\.json$/.test(file))
          .map((file) => ({ name: file, directory: childPath }));
        childTsconfigFiles.push(...childTsconfigs);
      }
    }

    const allTsconfigFiles = [...rootTsconfigFiles, ...childTsconfigFiles];

    if (allTsconfigFiles.length === 0) {
      logger.info(
        `No tsconfig.json file found in ${data.directory} or its child directories. Skipping type coverage analysis.`,
      );

      return okAsync({
        score: 0,
        message: `No tsconfig.json file found`,
      });
    }

    const aggResult = {
      totalCount: 0,
      correctCount: 0,
    };

    for (const { name, directory } of allTsconfigFiles) {
      const filePath = path.join(directory, name);
      logger.debug(`Found tsconfig.json: ${filePath}`);

      // Change working directory to where the tsconfig.json is located
      const result = await fromPromise(
        lint(filePath, { strict: true, absolutePath: true }),
        asError,
      );

      if (result.isErr()) {
        logger.debug(`Failed to lint with ${filePath}: ${result.error}`);
        continue;
      }

      if (result.value.totalCount === 0) {
        logger.info(`No valid tsconfig.json files found in ${data.directory}`);
        continue;
      }

      aggResult.totalCount += result.value.totalCount;
      aggResult.correctCount += result.value.correctCount;
    }

    if (aggResult.correctCount === 0) {
      return errAsync({
        score: 0,
        message: `No valid tsconfig.json files found`,
      });
    }

    return okAsync({
      score:
        (aggResult.correctCount / aggResult.totalCount) *
        data.config.deductionMultiplier,
      message: `${aggResult.correctCount} out of ${aggResult.totalCount} files have correct types`,
    });
  });
}
