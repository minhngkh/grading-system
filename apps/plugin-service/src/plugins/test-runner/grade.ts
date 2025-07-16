import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getBlobNameParts,
  getBlobNameRest,
} from "@grading-system/utils/azure-storage-blob";
import { zipSync } from "fflate";
import { errAsync, fromPromise, okAsync, Result, safeTry } from "neverthrow";
import { submissionStore } from "@/lib/blob-storage";
import { createTempDirectory, getFiles } from "@/lib/file";

// CriterionData interface matching the AI plugin
interface Criterion {
  criterionName: string;
  levels: {
    tag: string;
    description: string;
    weight: number;
  }[];
}

interface CriterionData extends Criterion {
  fileRefs: string[];
  plugin: string;
  configuration: string;
}

// Function signatures for script generation (to be implemented later)
declare function generateCompileScript(criterionData: CriterionData): string;
declare function generateRunScript(criterionData: CriterionData): string;

export function gradeSubmission(data: {
  attachments: string[];
  criterionData: CriterionData;
  attemptId?: string;
}) {
  return safeTry(async function* () {
    // Validate input
    if (data.criterionData.fileRefs.length === 0) {
      return errAsync(new Error("No files to grade"));
    }

    // Get the first file reference to determine blob name structure
    const firstFileRef = data.criterionData.fileRefs[0];
    const { root: gradingRef, rest } = getBlobNameParts(firstFileRef);
    const { root: submissionRef } = getBlobNameParts(rest);
    const sourceId = `${gradingRef}-${submissionRef}`;
    const blobNameRoot = `${gradingRef}/${submissionRef}`;

    // Get the relative paths for all files
    const blobNameRestList = yield* Result.combine(
      data.criterionData.fileRefs.map((blobName) => 
        getBlobNameRest(blobName, blobNameRoot)
      )
    );

    // Download all files to a temporary directory
    const cacheKey = data.attemptId 
      ? `test-runner-download-${data.attemptId}`
      : `test-runner-download-${sourceId}`;

    const { path: downloadDir } = yield* getFiles(
      submissionStore,
      blobNameRoot,
      blobNameRestList,
      cacheKey,
    );

    // Create output directory for the zip file
    const outputDir = yield* createTempDirectory(
      data.attemptId 
        ? `test-runner-output-${data.attemptId}`
        : `test-runner-output-${sourceId}`
    );

    // Generate compile and run scripts
    const compileScript = generateCompileScript(data.criterionData);
    const runScript = generateRunScript(data.criterionData);

    // Create zip file structure
    const zipData: Record<string, Uint8Array> = {};

    // Add all downloaded files to data/ directory in zip
    const fs = await import("node:fs/promises");
    const addFilesToZip = async (dir: string, prefix = "") => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const zipPath = path.join("data", prefix, entry.name).replace(/\\/g, "/");
        
        if (entry.isDirectory()) {
          await addFilesToZip(fullPath, path.join(prefix, entry.name));
        } else {
          const fileContent = await fs.readFile(fullPath);
          zipData[zipPath] = new Uint8Array(fileContent);
        }
      }
    };

    await addFilesToZip(downloadDir);

    // Add compile script
    zipData.compile = new TextEncoder().encode(compileScript);

    // Add run script  
    zipData.run = new TextEncoder().encode(runScript);

    // Create the zip file
    const zipBuffer = zipSync(zipData, {
      level: 6, // Compression level
      mtime: new Date(), // Modification time for all files
    });

    // Write zip file to output directory
    const zipFilePath = path.join(outputDir, `submission-${sourceId}.zip`);
    yield* fromPromise(
      writeFile(zipFilePath, zipBuffer),
      (error) => new Error(`Failed to write zip file: ${error}`)
    );

    return okAsync({
      zipFilePath,
      downloadDir,
      outputDir,
      sourceId,
      criterionName: data.criterionData.criterionName,
    });
  });
}
