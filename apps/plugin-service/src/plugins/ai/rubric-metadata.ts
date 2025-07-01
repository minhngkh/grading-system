import { getBlobNameParts } from "@grading-system/utils/azure-storage-blob";
import { deleteDirectory, deleteFile } from "@grading-system/utils/file";
import logger from "@grading-system/utils/logger";
import dedent from "dedent";
import { okAsync, safeTry } from "neverthrow";
import { rubricContextStore } from "@/lib/blob-storage";
import { createTempDirectory } from "@/lib/file";
import { createFileAliasManifest, createLlmFileParts } from "@/plugins/ai/media-files";

function createContextHeader(data: Record<string, unknown>) {
  return dedent`
    ## RUBRIC ADDITIONAL CONTEXT ###
    This is additional context for the provided rubric, which was not included in the rubric itself:
    \`\`\`json
    ${JSON.stringify(data, null, 2)}
    \`\`\`
  `;
}

const CONTEXT_MANIFEST_HEADER = dedent`
  ## Rubric additional context manifest ##
  There are also additional missing context for the provided rubric in form of files, which are uploaded separately. Please use this manifest to correlate the files with their original paths in the directory.
`;

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

    // TOOD: download straght to buffer or cache if it doesnt change 
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
      CONTEXT_MANIFEST_HEADER,
    );

    const contextHeader = createContextHeader(data.metadata);

    const contextManifest = `${contextHeader}\n\n${contextFilesManifest}`;

    return okAsync({
      manifest: contextManifest,
      llmMessageParts: contextFilesInfo.llmFileParts,
    });
  });
}
