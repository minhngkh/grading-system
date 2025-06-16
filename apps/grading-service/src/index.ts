import process from "node:process";
import { BlobServiceClient } from "@azure/storage-blob";
import { BlobService, getBlobName } from "@grading-system/utils/azure-storage-blob";
import { setup } from "@/core";

const CONNECTION_STRING = process.env["ConnectionStrings__submissions-store"] as string;
const DEFAULT_CONTAINER = "submissions-store";

const service = new BlobService(CONNECTION_STRING);
const container = service.getBlobContainer(DEFAULT_CONTAINER);

export function getBlobRoot(blobUrl: string): string {
  const name = getBlobName(blobUrl, DEFAULT_CONTAINER);
  const parts = name.split("/");

  return parts[0];
}

export function getBlobFile(blobUrl: string): string {
  const name = getBlobName(blobUrl, DEFAULT_CONTAINER);
  const parts = name.split("/");

  return parts[1];
}

async function main() {
  const client = BlobServiceClient.fromConnectionString(CONNECTION_STRING);

  const containerClient = client.getContainerClient(DEFAULT_CONTAINER);
  const blobs = containerClient.listBlobsFlat();

  for await (const blob of blobs) {
    console.log(blob.name);
  }

  const a = await container.downloadToBuffer(
    "grading-9cc3b3c8-a2bc-08dd-247b-fc212d4447c2/References/references.bib",
  );

  const text = a.toString("utf-8");
  console.log(text);
}

main();
