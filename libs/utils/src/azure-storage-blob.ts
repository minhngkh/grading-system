import type { Result } from "neverthrow";
import type { Buffer } from "node:buffer";
import { BlobSASPermissions, BlobServiceClient, SASProtocol } from "@azure/storage-blob";
import { err, ok, ResultAsync } from "neverthrow";
import { wrapError } from "./error";

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

export class BlobService {
  client: BlobServiceClient;

  constructor(connectionString: string) {
    this.client = BlobServiceClient.fromConnectionString(connectionString);
  }

  getBlobContainer(containerName: string) {
    return new BlobContainer(containerName, this.client);
  }
}

export class BlobContainer {
  containerName: string;
  client;

  constructor(containerName: string, ServiceClient: BlobServiceClient) {
    this.containerName = containerName;
    this.client = ServiceClient.getContainerClient(containerName);
  }

  downloadToBuffer(blobName: string): ResultAsync<Buffer<ArrayBufferLike>, Error> {
    const blobClient = this.client.getBlobClient(blobName);

    return ResultAsync.fromPromise(blobClient.downloadToBuffer(), (err) =>
      wrapError(err, `Failed to download blob ${blobName} to buffer`),
    );
  }

  downloadToFile(blobName: string, filePath: string): ResultAsync<void, Error> {
    const blobClient = this.client.getBlobClient(blobName);

    return ResultAsync.fromPromise(blobClient.downloadToFile(filePath), (err) =>
      wrapError(err, `Failed to download blob ${blobName} to file ${filePath}`),
    ).map(() => undefined);
  }

  getContentType(blobName: string): ResultAsync<string, Error> {
    const blobClient = this.client.getBlobClient(blobName);

    return ResultAsync.fromPromise(blobClient.getProperties(), (error) =>
      wrapError(error, `Failed to get content type for blob ${blobName}`),
    ).andThen((properties) => {
      if (!properties.contentType) {
        return err(new Error(`No content type found for blob ${blobName}`));
      }
      return ok(properties.contentType);
    });
  }

  generateSasUrlForBlob(blobName: string): ResultAsync<string, Error> {
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
      (error) => wrapError(error, `Failed to generate SAS URL for blob ${blobName}`),
    );
  }
}
