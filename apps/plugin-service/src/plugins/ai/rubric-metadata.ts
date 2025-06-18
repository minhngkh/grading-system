import { getBlobName, getBlobNameParts } from "@grading-system/utils/azure-storage-blob";
import dedent from "dedent";
import { okAsync, safeTry } from "neverthrow";
import { DEFAULT_CONTAINER, downloadFiles, downloadFiles2 } from "@/lib/blob-storage";
import { createFileAliasManifest, createMediaFileParts } from "@/plugins/ai/media-files";

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

export function generateRubricContext(data: { blobUrls: string[]; metadata: Record<string, unknown> }) {
  return safeTry(async function* () {
    const blobUrlPathMap = new Map<string, string>();
    for (const blobUrl of data.blobUrls) {
      // const blobName = yield* getBlobName(blobUrl, "");
      const { rest: blobPath } = getBlobNameParts(blobUrl);
      blobUrlPathMap.set(blobUrl, blobPath);
    }

    const contextFilesInfo = yield* downloadFiles2(data.blobUrls).andThen((value) => {
      console.log("dir", value.downloadDir)
      console.log("map", blobUrlPathMap.values())
      return createMediaFileParts(
        value.downloadDir,
        Array.from(blobUrlPathMap.values()),
        "context",
      );
    });

    const contextFilesManifest = yield* createFileAliasManifest(
      contextFilesInfo.urlAliasMap,
      CONTEXT_MANIFEST_HEADER,
    );

    const contextHeader = createContextHeader(data.metadata);

    const contextManifest = `${contextHeader}\n\n${contextFilesManifest}`;

    return okAsync({
      manifest: contextManifest,
      llmMessageParts: contextFilesInfo.parts,
    });
  });
}
