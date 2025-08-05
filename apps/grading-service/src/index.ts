import process from "node:process";
import {ServiceBusClient} from "@azure/service-bus"
import { BlobServiceClient } from "@azure/storage-blob";
import { BlobService, getBlobName } from "@grading-system/utils/azure-storage-blob";
import logger from "@grading-system/utils/logger";

const CONNECTION_STRING = process.env["ConnectionStrings__submissions-store"] as string;
const DEFAULT_CONTAINER = "submissions-store";

const service = new BlobService(CONNECTION_STRING);
const container = service.getBlobContainer(DEFAULT_CONTAINER);

// export function getBlobRoot(blobUrl: string): string {
//   const name = getBlobName(blobUrl, DEFAULT_CONTAINER);
//   const parts = name.split("/");

//   return parts[0];
// }

// export function getBlobFile(blobUrl: string): string {
//   const name = getBlobName(blobUrl, DEFAULT_CONTAINER);
//   const parts = name.split("/");

//   return parts[1];
// }

// const serviceBus = new ServiceBusClient(process.env.ConnectionStrings__messaging as string);

async function main() {
  // const client = BlobServiceClient.fromConnectionString(CONNECTION_STRING);

  // for await (const container of client.listContainers()) {
  //   console.log(`Container: ${container.name}`);
  // }

  // const containerClient = client.getContainerClient(DEFAULT_CONTAINER);
  // const blobs = containerClient.listBlobsFlat();

  
  // for await (const blob of blobs) {
  //   logger.info(blob.name);
  // }

  // // const a = await container.downloadToBuffer(
  // //   "grading-9cc3b3c8-a2bc-08dd-247b-fc212d4447c2/References/references.bib",
  // // );

  // // // const text = a.toString("utf-8");
  // // console.log(text);

}

main();
