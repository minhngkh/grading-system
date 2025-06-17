import type { FilePart } from "ai";
import { getBlobName } from "@grading-system/utils/azure-storage-blob";
import dedent from "dedent";
import { ok, okAsync, ResultAsync, safeTry } from "neverthrow";
import { blobContainer, DEFAULT_CONTAINER } from "@/lib/blob-storage";

const SUPPORTED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

function signBlobUrls(blobUrls: string[]) {
  return safeTry(async function* () {
    const withContentType = yield* ResultAsync.combine(
      blobUrls.map((url) => {
        return blobContainer.getContentType(url).map((contentType) => ({
          url,
          contentType,
        }));
      }),
    );

    const ignoredUrls: string[] = [];

    const filtered = withContentType.filter((item) => {
      if (SUPPORTED_CONTENT_TYPES.includes(item.contentType)) {
        return true;
      }

      ignoredUrls.push(item.url);
      return false;
    });

    const signed = yield* ResultAsync.combine(
      filtered.map((item) => {
        return blobContainer.generateSasUrlForBlob(item.url).map((signedUrl) => ({
          signedUrl,
          contentType: item.contentType,
        }));
      }),
    );

    return okAsync({
      signedUrls: signed,
      ignoredUrls,
    });
  });
}

export function createMediaFileParts(blobUrls: string[]) {
  const urlAliasMap = new Map<string, string>();

  return signBlobUrls(blobUrls).map((info) => {
    const parts = info.signedUrls.map((item, idx): FilePart => {
      const fileName = `file_${idx}`;
      urlAliasMap.set(item.signedUrl, fileName);

      return {
        type: "file",
        data: item.signedUrl,
        mimeType: item.contentType,
        filename: fileName,
      };
    });

    return {
      urlAliasMap,
      parts,
      ignoredUrls: info.ignoredUrls,
    };
  });
}

export function createFileAliasManifest(urlAliasMap: Map<string, string>) {
  return safeTry(function* () {
    const header = dedent`
      ### MULTIMODAL FILE MANIFEST ###
      This prompt includes the following non-text files, which have been uploaded separately. Please use this manifest to correlate the files with their original paths in the directory.
  
      ---
    `;

    const entries: string[] = [];
    for (const [url, alias] of urlAliasMap) {
      entries.push(dedent`
        - **File name:** \`${alias}\`
          - Original Path: \`${yield* getBlobName(url, DEFAULT_CONTAINER)}\`
  
      `);
    }
    const footer = dedent`
      ---
    `;

    return ok(`${header}\n${entries.join("\n")}${footer}\n`);
  });
}
