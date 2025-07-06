import { getBlobNameParts } from "@grading-system/utils/azure-storage-blob";
import { deleteDirectory } from "@grading-system/utils/file";
import logger from "@grading-system/utils/logger";
import { okAsync, safeTry } from "neverthrow";
import { rubricContextStore } from "@/lib/blob-storage";
import { createTempDirectory } from "@/lib/file";
import { createFileAliasManifest, createLlmFileParts } from "@/plugins/ai/media-files";
import {
  gradingContextHeader,
  gradingContextManifestHeader,
} from "@/plugins/ai/prompts/grade";

function createContextHeader(data: Record<string, unknown>) {
  return gradingContextHeader(JSON.stringify(data, null, 2));
}

export function generateRubricContext(data: {
  blobNameList: string[];
  metadata: Record<string, unknown>;
}) {
  return safeTry(async function* () {
    if (data.blobNameList.length === 0) {
      return okAsync({
        manifest: createContextHeader(data.metadata),
        llmMessageParts: [],
      });
    }

    const blobNameRoot = getBlobNameParts(data.blobNameList[0]).root;
    const blobNameRestList = data.blobNameList.map(
      (blobName) => getBlobNameParts(blobName).rest,
    );

    const downloadDirectory = yield* createTempDirectory("rubric-context");

    // TODO: download straight to buffer or cache if it doesn't change
    const contextFilesInfo = yield* rubricContextStore
      .downloadToDirectory(blobNameRoot, blobNameRestList, downloadDirectory)
      .andThen(() =>
        createLlmFileParts({
          blobNameRestList,
          downloadDirectory,
          prefix: "context",
        }),
      )
      .andTee(() => {
        deleteDirectory(downloadDirectory).orTee((error) => {
          logger.info(`Failed to delete rubric context files`, error);
        });
      });

    const contextFilesManifest = yield* createFileAliasManifest(
      contextFilesInfo.BlobNameRestAliasMap,
      gradingContextManifestHeader,
    );

    const contextHeader = createContextHeader(data.metadata);

    const contextManifest = `${contextHeader}\n\n${contextFilesManifest}`;

    return okAsync({
      manifest: contextManifest,
      llmMessageParts: contextFilesInfo.llmFileParts,
    });
  });
}
