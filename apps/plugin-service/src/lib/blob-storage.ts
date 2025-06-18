import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { logger } from "@azure/storage-blob";
import { BlobService, getBlobNameParts } from "@grading-system/utils/azure-storage-blob";
import { wrapError } from "@grading-system/utils/error";
import { okAsync, ResultAsync, safeTry } from "neverthrow";
import { cleanTempDirectory, createTempDirectory } from "@/lib/file";

const CONNECTION_STRING = process.env["ConnectionStrings__submissions-store"] as string;
export const DEFAULT_CONTAINER = "submissions-store";

const service = new BlobService(CONNECTION_STRING);
export const blobContainer = service.getBlobContainer(DEFAULT_CONTAINER);

export const blobContainer2 = service.getBlobContainer("rubric-context-store");

export function downloadFiles(blobNames: string[], directory?: string) {
  return safeTry(async function* () {
    const downloadDir = directory ?? (yield* createTempDirectory("download"));

    const createdDirs = new Set<string>();
    for (const blob of blobNames) {
      const { rest: blobFileName } = getBlobNameParts(blob);

      const downloadPath = path.join(downloadDir, blobFileName);
      const downloadDirPath = path.dirname(downloadPath);

      if (!createdDirs.has(downloadDirPath)) {
        // create folder to prepare for downloading
        yield* ResultAsync.fromPromise(
          fs.mkdir(downloadDirPath, { recursive: true }),
          (error) =>
            wrapError(error, `Failed to create directory for downloading blob: ${blob}`),
        ).andTee(() => createdDirs.add(downloadDirPath));
      }

      // download the blob
      yield* blobContainer.downloadToFile(blob, downloadPath).orTee(() => {
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

export function downloadFiles2(blobNames: string[], directory?: string) {
  return safeTry(async function* () {
    const downloadDir = directory ?? (yield* createTempDirectory("download"));

    const createdDirs = new Set<string>();
    for (const blob of blobNames) {
      const { rest: blobFileName } = getBlobNameParts(blob);

      const downloadPath = path.join(downloadDir, blobFileName);
      const downloadDirPath = path.dirname(downloadPath);

      if (!createdDirs.has(downloadDirPath)) {
        // create folder to prepare for downloading
        yield* ResultAsync.fromPromise(
          fs.mkdir(downloadDirPath, { recursive: true }),
          (error) =>
            wrapError(error, `Failed to create directory for downloading blob: ${blob}`),
        ).andTee(() => createdDirs.add(downloadDirPath));
      }

      // download the blob
      yield* blobContainer2.downloadToFile(blob, downloadPath).orTee(() => {
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