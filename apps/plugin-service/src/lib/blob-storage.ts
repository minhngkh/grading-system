import type { BlobContainer } from "@grading-system/utils/azure-storage-blob";
import process from "node:process";
import { BlobService, getBlobNameRest } from "@grading-system/utils/azure-storage-blob";
import { err, ok, okAsync, Result, safeTry } from "neverthrow";
import { EmptyListError } from "@/lib/error";
import { getFiles } from "@/lib/file";

const CONNECTION_STRING = process.env["ConnectionStrings__submissions-store"] as string;
const SUBMISSIONS_STORE = "submissions-store";
const RUBRIC_CONTEXT_STORE = "rubric-context-store";

const service = new BlobService(CONNECTION_STRING);
export const submissionStore = service.getBlobContainer(SUBMISSIONS_STORE);
export const rubricContextStore = service.getBlobContainer(RUBRIC_CONTEXT_STORE);

/**
 * The number of path levels that is pure identifier. For example, if the blob name is
 * "ref-1/submission-1/file.txt", the identifier path levels would be 2.
 */
export const IDENTIFIER_PATH_LEVELS = 2;

export function getBlobBatchInfo(blobNameList: string[], pathLevel: number) {
  return safeTry(function* () {
    if (blobNameList.length === 0) {
      return err(new EmptyListError({ message: "No blobs to process" }));
    }

    // Assuming all blobs in the list share the same root, could have a check here if
    // needed
    const blobNameRoot = blobNameList[0].split("/").slice(0, pathLevel).join("/");

    const blobNameRestList = yield* Result.combine(
      blobNameList.map((blobName) => getBlobNameRest(blobName, blobNameRoot)),
    );

    return ok({
      blobNameRoot,
      blobNameRestList,
    });
  });
}

export function downloadBlobBatch(
  container: BlobContainer,
  blobNameList: string[],
  pathLevel: number,
  cacheKey: string,
) {
  return safeTry(async function* () {
    const { blobNameRoot, blobNameRestList } = yield* getBlobBatchInfo(
      blobNameList,
      pathLevel,
    );

    const { path: downloadDir } = yield* getFiles(
      container,
      blobNameRoot,
      blobNameRestList,
      cacheKey,
    );

    return okAsync({
      downloadDir,
      blobNameRoot,
      blobNameRestList,
    });
  });
}
