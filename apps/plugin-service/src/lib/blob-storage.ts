import process from "node:process";
import { BlobService } from "@grading-system/utils/azure-storage-blob";

const CONNECTION_STRING = process.env["ConnectionStrings__submissions-store"] as string;
const SUBMISSIONS_STORE = "submissions-store";
const RUBRIC_CONTEXT_STORE = "rubric-context-store";

const service = new BlobService(CONNECTION_STRING);
export const submissionStore = service.getBlobContainer(SUBMISSIONS_STORE);
export const rubricContextStore = service.getBlobContainer(RUBRIC_CONTEXT_STORE);
