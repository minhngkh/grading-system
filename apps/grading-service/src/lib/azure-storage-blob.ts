import process from "node:process";
import { BlobServiceClient } from "@azure/storage-blob";

const CONNECTION_STRING = process.env.ConnectionStrings__submissions_store as string;

const client = BlobServiceClient.fromConnectionString(CONNECTION_STRING);

export class BlobContainer {
  containerName: string;
  #containerClient;

  constructor(containerName: string) {
    this.containerName = containerName;
    this.#containerClient = client.getContainerClient(containerName);
  }

  #GetBlobName(url: string) {
    const parts = url.split(`${this.containerName}/`);
    if (parts.length !== 2) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    return parts[1];
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

  async DownloadToBufferExp(url: string) {
    const blobName = this.#GetBlobName(url);
    return this.downloadToBuffer(blobName);
  }

  async DownloadToFileExp(url: string, filePath: string) {
    const blobName = this.#GetBlobName(url);
    return this.downloadToFile(blobName, filePath);
  }
}
