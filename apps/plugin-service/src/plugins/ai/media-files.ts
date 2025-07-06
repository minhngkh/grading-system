import type { BlobContainer } from "@grading-system/utils/azure-storage-blob";
import type { FilePart } from "ai";
import type { Result } from "neverthrow";
import { Buffer } from "node:buffer";
import path from "node:path";
import process from "node:process";
import { CustomErrorV0 } from "@grading-system/utils/error";
import { readFile } from "@grading-system/utils/file";
import dedent from "dedent";
import mime from "mime";
import { err, errAsync, ok, okAsync, ResultAsync, safeTry } from "neverthrow";

const SUPPORTED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  // "text/plain",
];

function signSupportedBlobs(container: BlobContainer, blobNameList: string[]) {
  return safeTry(async function* () {
    const signedBlobPromises = [];
    const ignoredBlobNames = [];

    for (const blobName of blobNameList) {
      const contentType = mime.getType(blobName);
      if (contentType === null || !SUPPORTED_CONTENT_TYPES.includes(contentType)) {
        ignoredBlobNames.push(blobName);
        continue;
      }

      signedBlobPromises.push(
        container.generateSignedUrl(blobName).map((signedUrl) => {
          return {
            blobName,
            signedUrl,
            contentType,
          };
        }),
      );
    }

    const signedBlobList = yield* ResultAsync.combine(signedBlobPromises);

    return okAsync({
      signedBlobList,
      ignoredBlobNames,
    });
  });
}

class NotSupportedInProductionError extends CustomErrorV0<void> {}

export function createLlmFileParts(data: {
  // blobNameRoot: string;
  blobNameRestList: string[];
  downloadDirectory: string;
  prefix?: string;
}) {
  return safeTry(async function* () {
    const prefix = data.prefix || "file";

    const BlobNameRestAliasMap = new Map<string, string>();

    if (process.env.NODE_ENV === "production") {
      // Should not download files in production, just sign the URLs
      return errAsync(
        new NotSupportedInProductionError({
          message: "Signing blob Urls in production is not yet implemented.",
          data: undefined,
        }),
      );
    }

    const promises = data.blobNameRestList.map((nameRest, idx) => {
      const filePath = path.join(data.downloadDirectory, nameRest);

      return readFile(filePath).map((content): Result<FilePart, void> => {
        const contentType = mime.getType(nameRest);
        if (contentType === null || !SUPPORTED_CONTENT_TYPES.includes(contentType)) {
          return err();
        }

        const fileAlias = `${prefix}_${idx}${path.extname(nameRest)}`;
        BlobNameRestAliasMap.set(nameRest, fileAlias);

        return ok({
          type: "file",
          data: Buffer.from(content).toString("base64"),
          mimeType: contentType,
          filename: fileAlias,
        });
      });
    });

    const result = yield* ResultAsync.combine(promises).map((value) => {
      const fileParts = [];
      const ignoredBlobNameRestList = [];

      for (const item of value) {
        if (item.isErr()) {
          ignoredBlobNameRestList.push(item.error);
          continue;
        }

        fileParts.push(item.value);
      }

      return {
        BlobNameRestAliasMap,
        llmFileParts: fileParts,
        ignoredBlobNameRestList,
      };
    });

    return okAsync(result);
  });
}

export const GRADING_FILES_HEADER = dedent`
  ### MULTIMODAL FILE MANIFEST ###
  - Addition to all of the text files listed above, this prompt includes the following non-text files, which have been uploaded separately. Please use this manifest to correlate the files with their original paths in the directory.
  - Remember to use the file original path instead of the uploaded file name when referring to the files in your response.
    - For example, if the uploaded file name is \`file_1.txt\` the original path is \`/path/to/text.txt\`, you should refer to the file as \`/path/to/text.txt\` in your response.
`;

const SEPARATOR = "\n---\n";

export function createFileAliasManifest(
  BlobNameRestAliasMap: Map<string, string>,
  header = GRADING_FILES_HEADER,
) {
  return safeTry(function* () {
    // yield* getBlobName(url, DEFAULT_CONTAINER)
    const entries: string[] = [];
    for (const [url, alias] of BlobNameRestAliasMap) {
      entries.push(dedent`
        - **Uploaded file name:** \`${alias}\`
          - Original Path: \`${url}\`
  
      `);
    }

    return ok(`${header}${SEPARATOR}${entries.join("\n")}${SEPARATOR}`);
  });
}
