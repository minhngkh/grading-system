import type { Result } from "neverthrow";
import path from "node:path";
import { BlobSASPermissions, BlobServiceClient, SASProtocol } from "@azure/storage-blob";
import { err, ok, ResultAsync, safeTry } from "neverthrow";
import { createDirectory, deleteDirectory } from "@/file";
import logger from "@/logger";
import { CustomError } from "./error";

export function getBlobName(url: string, containerName: string): Result<string, Error> {
  const parts = url.split(`${containerName}/`);
  if (parts.length !== 2) {
    return err(new Error(`Invalid URL format: ${url}`));
  }
  return ok(parts[1]);
}

export function getBlobNameParts(blobName: string) {
  const [root, ...rest] = blobName.split("/");

  return {
    root,
    rest: rest.join("/"),
  };
}

export function getBlobNameRest(blobName: string, blobNameRoot: string) {
  if (!blobName.startsWith(blobNameRoot)) {
    return err(
      new Error(`Blob name does not start with the expected root: ${blobNameRoot}`),
    );
  }

  const rest = blobName.slice(blobNameRoot.length + 1); // +1 for the slash
  return ok(rest);
}

export class BlobService {
  client: BlobServiceClient;

  constructor(connectionString: string) {
    this.client = BlobServiceClient.fromConnectionString(connectionString);
  }

  getBlobContainer(containerName: string) {
    return new BlobContainer(containerName, this.client);
  }
}

class DownloadToBufferError extends CustomError<{ blobName: string }> {}
class DownloadToFileError extends CustomError<{ blobName: string; localPath: string }> {}
class GenerateSignedUrlError extends CustomError<{ blobName: string }> {}

export class BlobContainer {
  containerName: string;
  client;

  constructor(containerName: string, ServiceClient: BlobServiceClient) {
    this.containerName = containerName;
    this.client = ServiceClient.getContainerClient(containerName);
  }

  downloadToBuffer(blobName: string) {
    const blobClient = this.client.getBlobClient(blobName);

    return ResultAsync.fromPromise(
      blobClient.downloadToBuffer(),
      (error) =>
        new DownloadToBufferError({
          message: `Failed to download blob to buffer`,
          options: { cause: error },
          data: { blobName },
        }),
    );
  }

  downloadToFile(blobName: string, localPath: string) {
    const blobClient = this.client.getBlobClient(blobName);

    return ResultAsync.fromPromise(
      blobClient.downloadToFile(localPath),
      (error) =>
        new DownloadToFileError({
          message: `Failed to download blob to file`,
          options: { cause: error },
          data: { blobName, localPath },
        }),
    ).map(() => undefined as void);
  }

  downloadToDirectory(
    blobNameRoot: string,
    blobNameRestList: string[],
    directoryPath: string,
  ) {
    // eslint-disable-next-line ts/no-this-alias
    const self = this;

    return safeTry(async function* () {
      const downloadPromises = [];

      const createdDirs = new Set<string>();
      for (const blobNameRest of blobNameRestList) {
        const blobName = `${blobNameRoot}/${blobNameRest}`;

        const blobFilePath = path.join(directoryPath, blobNameRest);
        const blobDirPath = path.dirname(blobFilePath);

        // check to create folder if it does not exist
        if (!createdDirs.has(blobDirPath)) {
          yield* createDirectory(blobDirPath).andTee(() => createdDirs.add(blobDirPath));
        }

        // download the blob
        downloadPromises.push(self.downloadToFile(blobName, blobFilePath));
      }

      return ResultAsync.combine(downloadPromises)
        .map(() => undefined as void)
        .orTee((error) => {
          logger.debug(`Attempt to clean up directory after failed download`, {
            blobName: error.data.blobName,
            blobLocalPath: error.data.localPath,
            directoryPath,
          });

          deleteDirectory(directoryPath)
            .orTee((error) => {
              logger.error(`Failed to clean temporary download directory`, error);
            })
            .andTee(() => {
              logger.debug(`Successfully clean temporary download directory`);
            });
        });
    });
  }

  generateSignedUrl(blobName: string) {
    const blobClient = this.client.getBlobClient(blobName);

    return ResultAsync.fromPromise(
      blobClient.generateSasUrl({
        permissions: BlobSASPermissions.from({
          read: true,
        }),
        protocol: SASProtocol.Https,
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour from now
      }),
      (error) =>
        new GenerateSignedUrlError({
          message: `Failed to sign url for blob`,
          options: { cause: error },
          data: { blobName },
        }),
    );
  }
}
