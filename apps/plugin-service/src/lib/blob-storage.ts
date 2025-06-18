import process from "node:process";
import { BlobService } from "@grading-system/utils/azure-storage-blob";

const CONNECTION_STRING = process.env["ConnectionStrings__submissions-store"] as string;
export const DEFAULT_CONTAINER = "submissions-store";

const service = new BlobService(CONNECTION_STRING);
export const blobContainer = service.getBlobContainer(DEFAULT_CONTAINER);