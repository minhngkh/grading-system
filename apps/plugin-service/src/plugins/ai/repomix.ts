import type { CliOptions } from "repomix";
import fs from "node:fs/promises";
import path from "node:path";
import { CustomError, wrapError } from "@grading-system/utils/error";
import { deleteFile } from "@grading-system/utils/file";
import logger from "@grading-system/utils/logger";
import fg from "fast-glob";
import { okAsync, ResultAsync, safeTry } from "neverthrow";
import { runDefaultAction } from "repomix";
import { submissionStore } from "@/lib/blob-storage";
import { createDirectoryOnSystemTemp, createTempDirectory, getFiles } from "@/lib/file";

const DELETE_PACKED_FILE = true;

function packFiles(options: {
  outputDirectory: string;
  outputFile: string;
  directory: string;
  includePattern?: string;
}) {
  return safeTry(async function* () {
    console.log(options);
    logger.debug("includePattern:", options);

    const runOptions = {
      output: options.outputFile,
      style: "xml",
      outputShowLineNumbers: true,
      directoryStructure: true,
      securityCheck: false,
      include: options.includePattern,
      quiet: true,
      verbose: false,
    } as CliOptions;

    const packingRunResult = yield* ResultAsync.fromPromise(
      runDefaultAction([options.directory], options.outputDirectory, runOptions),
      (error) => {
        logger.error("Failed to pack files:", error);
        return wrapError(error, "Failed to pack files");
      },
    );

    const outputFilePath = path.join(options.outputDirectory, options.outputFile);

    const packedContent = yield* ResultAsync.fromPromise(
      fs.readFile(outputFilePath, "utf-8"),
      (error) => wrapError(error, `Failed to read packed file`),
    ).andTee(() => {
      if (DELETE_PACKED_FILE) {
        deleteFile(outputFilePath).orTee((error) => {
          logger.error(`Failed to delete packed file after packing`, error);
        });
      }
    });

    return okAsync({
      packedContent,
      style: runOptions.style,
      totalTokens: packingRunResult.packResult.totalTokens,
      usedFiles: new Set(packingRunResult.packResult.processedFiles.map((f) => f.path)),
    });
  });
}

export type FilesSubset = {
  id: string;
  blobNameRestList: string[];
};

class PackFilesError extends CustomError<{
  ids: string[];
}> {}

type PackResult = {
  ids: string[];
  downloadDir: string;
  data: {
    packedContent: string;
    totalTokens: number;
    allBlobNameRests: string[];
    usedBlobNameRests: Set<string>;
  };
};

export function packFilesSubsets(
  sourceId: string,
  blobNameRoot: string,
  batches: FilesSubset[],
  tag?: string,
) {
  return safeTry(async function* () {
    let outputDir: string;
    if (tag) {
      outputDir = yield* createDirectoryOnSystemTemp(`pack-results-${tag}`);
    } else {
      outputDir = yield* createTempDirectory(`pack-results-${sourceId}`);
    }

    const allBlobNames = batches.flatMap((batch) => batch.blobNameRestList);

    const { path: downloadDir } = yield* getFiles(
      submissionStore,
      blobNameRoot,
      allBlobNames,
      `pack-download-${sourceId}`,
    );

    const packTasks: {
      subsetIds: string[];
      outputDirectory: string;
      outputFile: string;
      includePattern: string;
      allBlobNameRests: string[];
    }[] = [];

    const patternListIdxMap = new Map<string, number>();
    for (const [idx, value] of batches.entries()) {
      const blobs = value.blobNameRestList.sort().map((nameRest) => {
        return fg.escapePath(nameRest);
      });

      const includePattern = blobs.join(",");

      const listIdx = patternListIdxMap.get(includePattern);
      if (typeof listIdx !== "undefined") {
        packTasks[listIdx].subsetIds.push(value.id);
        continue;
      }

      // const blobUrlsSet = new Set(value.blobUrls);

      packTasks.push({
        subsetIds: [value.id],
        outputDirectory: outputDir,
        outputFile: `${idx}.xml`,
        includePattern,
        allBlobNameRests: value.blobNameRestList,
      });

      patternListIdxMap.set(includePattern, packTasks.length - 1);
    }

    const resultList = packTasks.map((task) =>
      packFiles({
        outputDirectory: task.outputDirectory,
        outputFile: task.outputFile,
        directory: downloadDir,
        includePattern: task.includePattern,
      })
        .map(
          (result): PackResult => ({
            ids: task.subsetIds,
            downloadDir,
            data: {
              packedContent: result.packedContent,
              totalTokens: result.totalTokens,
              allBlobNameRests: task.allBlobNameRests,
              usedBlobNameRests: result.usedFiles,
            },
          }),
        )
        .mapErr(
          (error) =>
            new PackFilesError({
              data: { ids: task.subsetIds },
              message: `Failed to pack files for criteria`,
              options: { cause: error },
            }),
        ),
    );

    return okAsync(resultList);
  });
}
