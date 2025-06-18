import type { FilePart } from "ai";
import { Buffer } from "node:buffer";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { getBlobName } from "@grading-system/utils/azure-storage-blob";
import { asError, CustomError } from "@grading-system/utils/error";
import dedent from "dedent";
import mime from "mime";
import {
  fromPromise,
  fromSafePromise,
  ok,
  okAsync,
  ResultAsync,
  safeTry,
} from "neverthrow";
import { blobContainer, DEFAULT_CONTAINER } from "@/lib/blob-storage";

const SUPPORTED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "text/plain",
];

// FIXME: it's not blob urls but blob names
function signBlobUrls(blobUrls: string[]) {
  return safeTry(async function* () {
    // const withContentType = yield* ResultAsync.combine(
    //   blobUrls.map((url) => {
    //     return blobContainer.getContentType(url).map((contentType) => ({
    //       url,
    //       contentType,
    //     }));
    //   }),
    // );
    const withContentType = blobUrls.map((url) => ({
      url,
      contentType: mime.getType(url) || "application/octet-stream",
    }));

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
          originalUrl: item.url,
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

export function createMediaFileParts(
  downloadDirectory: string,
  blobNames: string[],
  prefix = "file",
) {
  const urlAliasMap = new Map<string, string>();

  if (process.env.NODE_ENV === "production") {
    return signBlobUrls(blobNames).map((info) => {
      const parts = info.signedUrls.map((item, idx): FilePart => {
        const fileName = `${prefix}_${idx}`;
        urlAliasMap.set(item.originalUrl, fileName);

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

  const resultList = blobNames.map((name, idx) => {
    const filePath = path.join(downloadDirectory, name);

    console.log(filePath);
    
    return fromPromise(fs.readFile(filePath), asError)
      .map((content): FilePart => {
        const fileName = `file_${idx}`;
        urlAliasMap.set(name, fileName);

        return {
          type: "file",
          data: Buffer.from(content).toString("base64"),
          mimeType: mime.getType(name) || "application/octet-stream",
          filename: fileName,
        };
      })
      .mapErr(
        (error) =>
          new CustomError<{ fileName: string }>({
            data: { fileName: name },
            message: `Failed to read file ${name}`,
            options: { cause: error },
          }),
      );
  });

  return fromSafePromise(Promise.all(resultList)).map((value) => {
    const parts = [];
    const ignoredUrls = [];

    for (const item of value) {
      if (item.isOk()) {
        parts.push(item.value);
      } else {
        ignoredUrls.push(item.error.data.fileName);
      }
    }

    console.log("aliasMap", urlAliasMap);

    return {
      urlAliasMap,
      parts,
      ignoredUrls,
    };
  });
}

export const GRADING_FILES_HEADER = dedent`
  ### MULTIMODAL FILE MANIFEST ###
  Addition to all of the text files listed above, this prompt includes the following non-text files, which have been uploaded separately. Please use this manifest to correlate the files with their original paths in the directory.
`;

const SEPARATOR = "\n---\n";

export function createFileAliasManifest(
  urlAliasMap: Map<string, string>,
  header = GRADING_FILES_HEADER,
) {
  return safeTry(function* () {
    // yield* getBlobName(url, DEFAULT_CONTAINER)
    const entries: string[] = [];
    for (const [url, alias] of urlAliasMap) {
      entries.push(dedent`
        - **File name:** \`${alias}\`
          - Original Path: \`${url}\`
  
      `);
    }

    return ok(`${header}${SEPARATOR}${entries.join("\n")}${SEPARATOR}`);
  });
}
