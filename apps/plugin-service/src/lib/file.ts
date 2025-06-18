import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getBlobName, getBlobNameParts } from "@grading-system/utils/azure-storage-blob";
import { Cache } from "@grading-system/utils/cache";
import { wrapError } from "@grading-system/utils/error";
import { errAsync, okAsync, ResultAsync, safeTry } from "neverthrow";
import { DEFAULT_CONTAINER, downloadFiles } from "@/lib/blob-storage";

const PREFIX = "plugin-service";

export function checkDirectoryExists(tag: string): ResultAsync<string, Error> {
  const dirPath = path.join(os.tmpdir(), `${PREFIX}-${tag}`);

  return ResultAsync.fromPromise(fs.access(dirPath), (error) =>
    wrapError(error, `Directory doesn't exit at ${dirPath}`),
  ).map(() => dirPath);
}

export function createDirectoryOnSystemTemp(tag: string): ResultAsync<string, Error> {
  const dirPath = path.join(os.tmpdir(), `${PREFIX}-${tag}`);

  return ResultAsync.fromPromise(fs.mkdir(dirPath), (error) =>
    wrapError(error, `Failed to create directory at ${dirPath}`),
  ).map(() => dirPath);
}

export function createTempDirectory(tag?: string): ResultAsync<string, Error> {
  const prefix = tag ? `${PREFIX}-${tag}-` : `${PREFIX}-`;

  return ResultAsync.fromPromise(fs.mkdtemp(path.join(os.tmpdir(), prefix)), (error) =>
    wrapError(error, `Failed to create temporary directory`),
  );
}

export function cleanTempDirectory(path: string): ResultAsync<void, Error> {
  if (!path.includes(PREFIX)) {
    return errAsync(new Error("Invalid temporary directory path"));
  }

  return ResultAsync.fromPromise(fs.rm(path, { recursive: true, force: true }), (err) =>
    wrapError(err, `Failed to clean temporary directory`),
  );
}

export function deleteDirectory(path: string): ResultAsync<void, Error> {
  return ResultAsync.fromPromise(fs.rm(path, { recursive: true, force: true }), (err) =>
    wrapError(err, `Failed to delete directory at ${path}`),
  );
}

export function deleteFile(filePath: string): ResultAsync<void, Error> {
  return ResultAsync.fromPromise(fs.unlink(filePath), (err) =>
    wrapError(err, `Failed to delete file at ${filePath}`),
  );
}

type DownloadDirectory = {
  path: string;
  downloadedUrl: Set<string>;
};

const downloadCache = new Cache<DownloadDirectory>();

/**
 * Attempt to download files if not cached
 *
 * @param urls array of blob URLs to download
 * @param cacheKey cache key to use for storing downloaded files
 * @returns directory path and a map of blob URLs to their "names" (aka relative path)
 */
export function getFiles(
  urls: string[],
  cacheKey: string,
): ResultAsync<
  {
    path: string;
    urlNameMap: Map<string, string>;
    pathUrlMap: Map<string, string>;
  },
  Error
> {
  return safeTry(async function* () {
    const blobUrlNameMap = new Map<string, string>();
    const blobPathUrlMap = new Map<string, string>();
    for (const blobUrl of urls) {
      const blobName = yield* getBlobName(blobUrl, DEFAULT_CONTAINER);
      blobUrlNameMap.set(blobUrl, blobName);

      const { rest: blobPath } = getBlobNameParts(blobName);
      blobPathUrlMap.set(blobPath, blobUrl);
    }

    // const downloadTag = `pack-download-${cacheKey}`;

    const cachedDownloadDirResult = downloadCache.get(cacheKey);

    if (cachedDownloadDirResult.isOk()) {
      const dir = cachedDownloadDirResult.value;

      const blobsToDownload = Array.from(blobUrlNameMap.entries()).filter(([url]) =>
        dir.downloadedUrl.has(url),
      );
      const blobsToDownloadUrls = blobsToDownload.map(([url]) => url);
      const blobsToDownloadName = blobsToDownload.map(([_, name]) => name);

      yield* downloadFiles(blobsToDownloadName, dir.path)
        .andTee(() => {
          downloadCache.set(cacheKey, {
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
        pathUrlMap: blobPathUrlMap,
      });
    }

    const downloadDir = yield* createDirectoryOnSystemTemp(cacheKey);
    yield* downloadFiles(Array.from(blobUrlNameMap.values()), downloadDir).andTee(() => {
      downloadCache.set(cacheKey, {
        path: downloadDir,
        downloadedUrl: new Set(urls),
      });
    });

    return okAsync({
      path: downloadDir,
      urlNameMap: blobUrlNameMap,
      pathUrlMap: blobPathUrlMap,
    });
  });
}