import type { CriterionData } from "@grading-system/plugin-shared/plugin/data";
import type { TypeCoverageConfig } from "./config";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { defaultGradeSubmissionFunc } from "@grading-system/plugin-shared/plugin/default";
import { asError, DefaultError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { fromPromise, okAsync, safeTry } from "neverthrow";
import { lint } from "type-coverage-core";

export const gradeSubmission = defaultGradeSubmissionFunc(gradeCriterion);

export function gradeCriterion(data: {
  attemptId: string;
  criterionData: CriterionData<TypeCoverageConfig>;
  fileList: string[];
  directory: string;
  stripFunc: (filePath: string) => string;
}) {
  return safeTry(async function* () {
    const directoryContents = yield* fromPromise(
      readdir(data.directory, { withFileTypes: true }),
      (error) =>
        new DefaultError({
          message: `Failed to read directory ${data.directory}`,
          cause: error,
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
      return okAsync({
        score: 0,
        message: `No valid tsconfig.json files found`,
      });
    }

    return okAsync({
      score:
        (aggResult.correctCount / aggResult.totalCount) *
        data.criterionData.configuration.deductionMultiplier,
      message: `${aggResult.correctCount} out of ${aggResult.totalCount} files have correct types`,
    });
  });
}
