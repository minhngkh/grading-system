import type { BlobContainer } from "@grading-system/utils/azure-storage-blob";
import fs from "node:fs/promises";
import path from "node:path";
import { Cache } from "@grading-system/utils/cache";
import { CustomError, wrapError } from "@grading-system/utils/error";
import * as fileUtils from "@grading-system/utils/file";
import logger from "@grading-system/utils/logger";
import { errAsync, fromPromise, okAsync, ResultAsync, safeTry } from "neverthrow";
import { EmptyListError } from "@/lib/error";

const PREFIX = "plugin-service";

export const createDirectoryOnSystemTemp = (name: string) =>
  fileUtils.createDirectoryOnSystemTemp(`${PREFIX}-${name}`);

export const createTempDirectory = (name: string) =>
  fileUtils.createTempDirectory(`${PREFIX}-${name}`);

export function cleanTempDirectory(path: string): ResultAsync<void, Error> {
  if (!path.includes(PREFIX)) {
    return errAsync(new Error("Invalid temporary directory path"));
  }

  return ResultAsync.fromPromise(fs.rm(path, { recursive: true, force: true }), (err) =>
    wrapError(err, `Failed to clean temporary directory`),
  );
}

type DownloadDirectory = {
  path: string;
  downloadedBlobNameRestList: Set<string>;
};

const downloadCache = new Cache<DownloadDirectory>();

/**
 * Attempt to download files if not cached
 *
 */
export function getFiles(
  container: BlobContainer,
  blobNameRoot: string,
  blobNameRestList: string[],
  cacheKey: string,
) {
  return safeTry(async function* () {
    const cachedDownloadDirResult = downloadCache.get(cacheKey);

    if (cachedDownloadDirResult.isOk()) {
      const dir = cachedDownloadDirResult.value;

      const blobNameRestToDownloadList = blobNameRestList.filter((nameRest) =>
        dir.downloadedBlobNameRestList.has(nameRest),
      );

      yield* container
        .downloadToDirectory(blobNameRoot, blobNameRestToDownloadList, dir.path)
        .andTee(() => {
          downloadCache.set(cacheKey, {
            path: dir.path,
            downloadedBlobNameRestList: new Set(blobNameRestList),
          });
        })
        .mapErr((error) =>
          wrapError(error, `Failed to download new files to cache directory`),
        );

      return okAsync({ path: dir.path });
    }

    // const downloadDir = yield* createDirectoryOnSystemTemp(cacheKey)
    const downloadDir = yield* createTempDirectory(cacheKey);
    yield* container
      .downloadToDirectory(blobNameRoot, blobNameRestList, downloadDir)
      .andTee(() => {
        downloadCache.set(cacheKey, {
          path: downloadDir,
          downloadedBlobNameRestList: new Set(blobNameRestList),
        });
      });

    return okAsync({ path: downloadDir });
  });
}

class SymlinkError extends CustomError.withTag("SymlinkError")<void> {}

export function symlinkFiles(originalDirectory: string, fileList: string[], tag: string) {
  return safeTry(async function* () {
    if (fileList.length === 0) {
      return errAsync(new EmptyListError({ message: "No files to symlink" }));
    }

    const newDir = yield* createTempDirectory(tag);

    const promises = fileList.map((file) => {
      return fromPromise(
        fs.symlink(path.join(newDir, file), path.join(originalDirectory, file)),
        (error) =>
          new SymlinkError({ message: `Failed to symlink file ${file}`, cause: error }),
      );
    });

    yield* ResultAsync.combine(promises).orTee((error) => {
      logger.info("Failed to symlink files:", error);

      cleanTempDirectory(newDir).orTee((error) => {
        logger.info(`Failed to clean temporary directory after symlinking`, error);
      });
    });

    return okAsync({
      path: newDir,
    });
  });
}
