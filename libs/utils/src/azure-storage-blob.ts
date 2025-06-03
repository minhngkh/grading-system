import { BlobServiceClient } from "@azure/storage-blob";

export function getBlobName(url: string, containerName: string) {
  const parts = url.split(`${containerName}/`);
  if (parts.length !== 2) {
    throw new Error(`Invalid URL format: ${url}`);
  }
  return parts[1];
}

export class BlobService {
  #client: BlobServiceClient;

  constructor(connectionString: string) {
    this.#client = BlobServiceClient.fromConnectionString(connectionString);
  }

  getBlobContainer(containerName: string) {
    return new BlobContainer(containerName, this.#client);
  }
}

export class BlobContainer {
  containerName: string;
  #containerClient;

  constructor(containerName: string, client: BlobServiceClient) {
    this.containerName = containerName;
    this.#containerClient = client.getContainerClient(containerName);
  }

  async downloadToBuffer(blobName: string) {
    const blobClient = this.#containerClient.getBlobClient(blobName);
    const blob = await blobClient.downloadToBuffer();
    return blob;
  }

  async downloadToFile(blobName: string, filePath: string) {
    const blobClient = this.#containerClient.getBlobClient(blobName);
    const blob = await blobClient.downloadToFile(filePath);
    return blob;
  }
}
