import type { Result } from "neverthrow";
import type { CliOptions } from "repomix";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { BlobService, getBlobName } from "@grading-system/utils/azure-storage-blob";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { err, ok, ResultAsync } from "neverthrow";
import { runDefaultAction } from "repomix";
import { cleanTempDirectory, createTempDirectory } from "@/utils/file";

const CONNECTION_STRING = process.env["ConnectionStrings__submissions-store"] as string;
const DEFAULT_CONTAINER = "submissions-store";

const service = new BlobService(CONNECTION_STRING);
const container = service.getBlobContainer(DEFAULT_CONTAINER);

export function getBlobRoot(blobUrl: string): string {
  const name = getBlobName(blobUrl, DEFAULT_CONTAINER);
  const parts = name.split("/");

  return parts[0];
}

export function getBlobFile(blobUrl: string): string {
  const name = getBlobName(blobUrl, DEFAULT_CONTAINER);
  const parts = name.split("/");

  return parts[1];
}

export async function downloadFiles(blobUrls: string[]) {
  const blobRoot = getBlobRoot(blobUrls[0]);

  const createDownloadDirResult = await createTempDirectory();
  if (createDownloadDirResult.isErr()) {
    return err(createDownloadDirResult.error);
  }

  const downloadDir = createDownloadDirResult.value;

  const blobMap = new Map<string, string>();
  for (const url of blobUrls) {
    if (blobMap.has(url)) {
      continue;
    }

    const file = getBlobFile(url);
    blobMap.set(url, file);

    const filePath = path.join(downloadDir, file);
    const createDirResult = await ResultAsync.fromPromise(
      fs.mkdir(path.dirname(filePath), { recursive: true }),
      asError,
    );

    if (createDirResult.isErr()) {
      return err(createDirResult.error);
    }

    const downloadResult = await ResultAsync.fromPromise(
      container.downloadToFile(path.join(blobRoot, file), filePath),
      (err) =>
        wrapError(asError(err), `Failed to download blob ${file} from ${blobRoot}`),
    ).mapErr(async (error) => {
      const result = await cleanTempDirectory(downloadDir);
      if (result.isErr()) {
        logger.error("Failed to clean temporary directory after download error");
      }

      return error;
    });

    if (downloadResult.isErr()) return err(downloadResult.error);
  }

  return ok({
    blobRoot,
    directory: downloadDir,
    blobMap,
  });
}

const OUTPUT_DIR = path.join(process.cwd(), "tmp", "pack-files-results");

export async function packFiles(options: {
  outputFile: string;
  directory: string;
  includePattern?: string;
}): Promise<Result<{ content: string; style?: string; totalTokens: number }, Error>> {
  const runOptions = {
    output: options.outputFile,
    style: "xml",
    outputShowLineNumbers: true,
    directoryStructure: true,
    securityCheck: false,
    include: options.includePattern,
  } as CliOptions;

  const packResult = await ResultAsync.fromPromise(
    runDefaultAction([options.directory], OUTPUT_DIR, runOptions),
    asError,
  ).andTee((_) => cleanTempDirectory(options.directory));

  if (packResult.isErr()) {
    logger.error("Failed to pack files:", packResult.error);
    return err(packResult.error);
  }

  const outputFilePath = path.join(OUTPUT_DIR, options.outputFile);

  const contentResult = await ResultAsync.fromPromise(
    fs.readFile(outputFilePath, "utf-8"),
    asError,
  );

  if (contentResult.isErr()) {
    logger.error("Failed to read packed file content:", contentResult.error);
    return err(contentResult.error);
  }

  return ok({
    content: contentResult.value,
    style: runOptions.style,
    totalTokens: packResult.value.packResult.totalTokens,
  });
}

export async function packSubmission(data: { criterion: string; fileRefs: string[] }[]) {
  const createOutputDirResult = await ResultAsync.fromPromise(
    fs.mkdir(OUTPUT_DIR, { recursive: true }),
    asError,
  );
  if (createOutputDirResult.isErr()) {
    return err(createOutputDirResult.error);
  }

  const fileRefs = data.flatMap((c) => c.fileRefs);

  const downloadResult = await downloadFiles(fileRefs);
  if (downloadResult.isErr()) {
    logger.debug("failed here");
    console.log(downloadResult.error);
    return err(downloadResult.error);
  }

  const downloadInfo = downloadResult.value;

  const blobRoot = getBlobRoot(fileRefs[0]);

  const patternIdxMap = new Map<string, number>();
  const packList: { criteria: string[]; outputFile: string; includePattern: string }[] =
    [];
  for (const [idx, value] of data.entries()) {
    const files = value.fileRefs.map((f) => downloadInfo.blobMap.get(f)!);
    const includePattern = files.join(",");

    const existingIdx = patternIdxMap.get(includePattern);
    if (typeof existingIdx !== "undefined") {
      packList[existingIdx].criteria.push(value.criterion);
      continue;
    }

    packList.push({
      criteria: [value.criterion],
      outputFile: `${blobRoot}-${idx}`,
      includePattern,
    });

    patternIdxMap.set(includePattern, idx);
  }
  console.log("download inf:", downloadInfo);
  console.log(packList[0].outputFile);
  
  const packResults = await Promise.all(
    packList.map((item) =>
      packFiles({
        outputFile: item.outputFile,
        directory: downloadInfo.directory,
        includePattern: item.includePattern,
      }),
    ),
  );

  const errorList: { criteria: string[]; error: string }[] = [];
  const okList: {
    criteria: string[];
    content: string;
    totalTokens: number;
    style?: string;
  }[] = [];

  packResults.forEach((result, idx) => {
    if (result.isErr()) {
      logger.error(
        `Failed to pack files for criterion ${packList[idx].criteria.join(", ")}:`,
        result.error,
      );

      errorList.push({
        criteria: packList[idx].criteria,
        error: "Cannot use files for grading",
      });

      return;
    }

    okList.push({
      criteria: packList[idx].criteria,
      content: result.value.content,
      totalTokens: result.value.totalTokens,
      style: result.value.style,
    });
  });

  return ok({
    okList,
    errorList,
  });
}
