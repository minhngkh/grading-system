import type { ResultAsync } from "neverthrow";
import type { CriterionData } from "@/plugin/data";
import fs from "node:fs/promises";
import path from "node:path/posix";
import {
  getBlobNameParts,
  getBlobNameRest,
} from "@grading-system/utils/azure-storage-blob";
import { asError, DefaultError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { errAsync, fromPromise, okAsync, Result, safeTry } from "neverthrow";
import {
  downloadBlobBatch,
  IDENTIFIER_PATH_LEVELS,
  submissionStore,
} from "@/lib/blob-storage";
import { cleanTempDirectory, symlinkFiles } from "@/lib/file";
import { ErrorWithCriterionInfo } from "@/plugin/error";

type GradeInfo<TConfig extends object> = {
  attemptId: string;
  criterionData: CriterionData<TConfig>;
  fileList: string[];
  directory: string;
};

type GradeCriterionFunc<TConfig extends object, TSuccess, TError extends Error> = (
  data: GradeInfo<TConfig> & {
    stripFunc: (filePath: string) => string;
  },
) => Result<TSuccess, TError> | ResultAsync<TSuccess, TError>;

type TransformationFunc<TData, TTransformed, TConfig extends object> = (
  data: TData,
  gradeInfo: GradeInfo<TConfig> & {
    toFileRef: (filePath: string) => string;
  },
) => TTransformed;

export function defaultGradeSubmissionFunc<
  TConfig extends object,
  TSuccess,
  TError extends Error,
>(
  gradeCriterionFunc: GradeCriterionFunc<TConfig, TSuccess, TError>,
): (data: {
  attachments: string[];
  metadata: Record<string, unknown>;
  criterionDataList: CriterionData<TConfig>[];
  attemptId: string;
}) => ResultAsync<
  ResultAsync<
    {
      criterion: string;
      result: TSuccess;
    },
    ErrorWithCriterionInfo
  >[],
  Error
>;
export function defaultGradeSubmissionFunc<
  TConfig extends object,
  TSuccess,
  TError extends Error,
  TTransformed,
>(
  gradeCriterionFunc: GradeCriterionFunc<TConfig, TSuccess, TError>,
  transformationFunc: TransformationFunc<TSuccess, TTransformed, TConfig>,
): (data: {
  attachments: string[];
  metadata: Record<string, unknown>;
  criterionDataList: CriterionData<TConfig>[];
  attemptId: string;
}) => ResultAsync<
  ResultAsync<
    {
      criterion: string;
      result: TTransformed;
    },
    ErrorWithCriterionInfo
  >[],
  Error
>;

export function defaultGradeSubmissionFunc<
  TConfig extends object,
  TSuccess,
  TError extends Error,
  TTransformed,
>(
  gradeCriterionFunc: GradeCriterionFunc<TConfig, TSuccess, TError>,
  transformationFunc?: TransformationFunc<TSuccess, TTransformed, TConfig>,
): (data: {
  attachments: string[];
  metadata: Record<string, unknown>;
  criterionDataList: CriterionData<TConfig>[];
  attemptId: string;
}) => ResultAsync<
  ResultAsync<
    {
      criterion: string;
      result: TSuccess | TTransformed;
    },
    ErrorWithCriterionInfo
  >[],
  Error
> {
  return (data: {
    attachments: string[];
    metadata: Record<string, unknown>;
    criterionDataList: CriterionData<TConfig>[];
    attemptId: string;
  }) => {
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
          criterionData.fileRefs.map((blobName) =>
            getBlobNameRest(blobName, blobNameRoot),
          ),
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

        return symlinkPromise
          .map((value) => {
            return {
              criterionData,
              fileList: blobNameRestList.value,
              directory: value.path,
            };
          })
          .mapErr((error) => {
            logger.info(
              `internal: Failed to grade ${criterionData.criterionName}:`,
              error,
            );

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

          const gradeInfo = {
            attemptId: data.attemptId,
            criterionData: value.criterionData,
            fileList: value.fileList,
            directory: value.directory,
          };

          return gradeCriterionFunc({
            ...gradeInfo,
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
              let actualGradeResult;
              if (transformationFunc) {
                actualGradeResult = transformationFunc(gradeResult, {
                  ...gradeInfo,
                  toFileRef,
                });
              } else {
                actualGradeResult = gradeResult;
              }

              const result = {
                criterion: value.criterionData.criterionName,
                result: actualGradeResult,
              };

              logger.debug("Graded criterion result", result);

              return result;
            });
        }),
      );

      return okAsync(gradeCriterionPromises);
    });
  };
}

type FileListType = "single-folder" | "single-file";

/**
 * The fieList in grading info can either be a list of files inside a single folder (from
 * zip extraction) or a single file, we need to detect this
 */
function detectFileListType(
  fileList: string[],
  directory: string,
): ResultAsync<FileListType, DefaultError> {
  if (fileList.length === 1) {
    const filePath = path.join(directory, fileList[0]);
    return fromPromise(fs.stat(filePath), asError).map((value) => {
      return value.isDirectory() ? "single-folder" : "single-file";
    });
  }

  return okAsync("single-folder");
}
