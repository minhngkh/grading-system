import type { CliOptions } from "repomix";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  BlobService,
  getBlobName,
  getBlobNameParts,
} from "@grading-system/utils/azure-storage-blob";
import { Cache } from "@grading-system/utils/cache";
import { wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { escapePath } from "fast-glob";
import { okAsync, ResultAsync, safeTry } from "neverthrow";
import { runDefaultAction } from "repomix";
import {
  cleanTempDirectory,
  createDirectoryOnSystemTemp,
  createTempDirectory,
  deleteFile,
} from "@/utils/file";

const CONNECTION_STRING = process.env["ConnectionStrings__submissions-store"] as string;
const DEFAULT_CONTAINER = "submissions-store";

const service = new BlobService(CONNECTION_STRING);
const container = service.getBlobContainer(DEFAULT_CONTAINER);

type DownloadDirectory = {
  path: string;
  downloadedUrl: Set<string>;
};

const downloadCache = new Cache<DownloadDirectory>();

function downloadFiles(blobs: string[], directory?: string) {
  return safeTry(async function* () {
    const downloadDir = directory ?? (yield* createTempDirectory("download"));

    const createdDirs = new Set<string>();
    for (const blob of blobs) {
      const { rest: blobFileName } = getBlobNameParts(blob);

      const downloadPath = path.join(downloadDir, blobFileName);
      const downloadDirPath = path.dirname(downloadPath);

      if (createdDirs.has(downloadDirPath)) {
        continue;
      }

      // create folder to prepare for downloading
      yield* ResultAsync.fromPromise(
        fs.mkdir(downloadDirPath, { recursive: true }),
        (error) =>
          wrapError(error, `Failed to create directory for downloading blob: ${blob}`),
      ).andTee(() => createdDirs.add(downloadDirPath));

      // download the blob
      yield* container.downloadToFile(blob, downloadPath).orTee(() => {
        cleanTempDirectory(downloadDir).orTee(() => {
          logger.error(`Failed to clean temporary download directory ${downloadDir}`);
        });
      });
    }

    return okAsync({
      downloadDir,
    });
  });
}

const DELETE_PACKED_FILE = true;

function packFiles(options: {
  outputDirectory: string;
  outputFile: string;
  directory: string;
  includePattern?: string;
}) {
  return safeTry(async function* () {
    const runOptions = {
      output: options.outputFile,
      style: "xml",
      outputShowLineNumbers: true,
      directoryStructure: true,
      securityCheck: false,
      include: options.includePattern,
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
          logger.error(`Failed to delete packed file ${outputFilePath}:`, error);
        });
      }
    });

    return okAsync({
      packedContent,
      style: runOptions.style,
      totalTokens: packingRunResult.packResult.totalTokens,
    });
  });
}

/**
 * Attempt to download files if not cached
 *
 * @param urls array of blob URLs to download
 * @param cacheKey cache key to use for storing downloaded files
 * @returns directory path and a map of blob URLs to their "names" (aka relative path)
 */
function getFiles(
  urls: string[],
  cacheKey: string,
): ResultAsync<
  {
    path: string;
    urlNameMap: Map<string, string>;
  },
  Error
> {
  return safeTry(async function* () {
    const allBlobNames: string[] = [];
    const blobUrlNameMap = new Map<string, string>();
    for (const blobUrl of urls) {
      const blobName = yield* getBlobName(blobUrl, DEFAULT_CONTAINER);
      allBlobNames.push(blobName);
      blobUrlNameMap.set(blobUrl, blobName);
    }

    const downloadTag = `pack-download-${cacheKey}`;

    const cachedDownloadDirResult = downloadCache.get(downloadTag);

    if (cachedDownloadDirResult.isOk()) {
      const dir = cachedDownloadDirResult.value;

      const blobsToDownload = Array.from(blobUrlNameMap.entries()).filter(([url]) =>
        dir.downloadedUrl.has(url),
      );
      const blobsToDownloadUrls = blobsToDownload.map(([url]) => url);
      const blobsToDownloadName = blobsToDownload.map(([_, name]) => name);

      yield* downloadFiles(blobsToDownloadName, dir.path)
        .andTee(() => {
          downloadCache.set(downloadTag, {
            path: dir.path,
            downloadedUrl: new Set(blobsToDownloadUrls),
          });
        })
        .mapErr((error) =>
          wrapError(error, `Failed to download new files to cache directory`),
        );

      return okAsync({
        path: dir.path,
        urlNameMap: blobUrlNameMap,
      });
    }

    const downloadDir = yield* createDirectoryOnSystemTemp(downloadTag);
    yield* downloadFiles(allBlobNames, downloadDir).andTee(() => {
      downloadCache.set(downloadTag, {
        path: downloadDir,
        downloadedUrl: new Set(urls),
      });
    });

    return okAsync({
      path: downloadDir,
      urlNameMap: blobUrlNameMap,
    });
  });
}

type PackResult =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      packedContent: string;
      totalTokens: number;
    };

type packFilesSubsetsResult = ({ ids: string[] } & PackResult)[];

export type FilesSubset = {
  id: string;
  blobUrls: string[];
};

export function packFilesSubsets(sourceId: string, batches: FilesSubset[], tag?: string) {
  return safeTry(async function* () {
    let outputDir: string;
    if (tag) {
      outputDir = yield* createDirectoryOnSystemTemp(`pack-results-${tag}`);
    } else {
      outputDir = yield* createTempDirectory(`pack-results-${sourceId}`);
    }

    const allBlobUrls = batches.flatMap((batch) => batch.blobUrls);

    const { path: downloadDir, urlNameMap: blobUrlNameMap } = yield* getFiles(
      allBlobUrls,
      sourceId,
    );

    const packTasks: {
      subsetIds: string[];
      outputDirectory: string;
      outputFile: string;
      includePattern: string;
    }[] = [];

    const patternListIdxMap = new Map<string, number>();
    for (const [idx, value] of batches.entries()) {
      const blobs = value.blobUrls.map((url) => escapePath(blobUrlNameMap.get(url)!));
      const includePattern = blobs.join(",");

      const listIdx = patternListIdxMap.get(includePattern);
      if (typeof listIdx !== "undefined") {
        packTasks[listIdx].subsetIds.push(value.id);
        continue;
      }

      packTasks.push({
        subsetIds: [value.id],
        outputDirectory: outputDir,
        outputFile: `${idx}.xml`,
        includePattern,
      });

      patternListIdxMap.set(includePattern, packTasks.length - 1);
    }

    const packResults: packFilesSubsetsResult = [];

    await Promise.all(
      packTasks.map((task) =>
        packFiles({
          outputDirectory: task.outputDirectory,
          outputFile: task.outputFile,
          directory: downloadDir,
          includePattern: task.includePattern,
        }).match(
          (result) => {
            packResults.push({
              success: true,
              ids: task.subsetIds,
              packedContent: result.packedContent,
              totalTokens: result.totalTokens,
            });
          },
          () => {
            packResults.push({
              success: false,
              ids: task.subsetIds,
              error: "Failed to extract files",
            });
          },
        ),
      ),
    );

    return okAsync(packResults);
  });
}
