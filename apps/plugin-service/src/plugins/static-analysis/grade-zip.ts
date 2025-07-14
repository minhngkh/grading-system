import type { AnalysisFile, AnalysisResponse } from './types';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { analyzeFiles } from './core';

/**
 * Analyze a zip file buffer: extract, detect language, grade with Semgrep, return JSON result.
 * @param zipBuffer Buffer of the zip file
 * @returns Promise<AnalysisResponse>
 */
export async function analyzeZipBuffer(zipBuffer: Buffer): Promise<AnalysisResponse> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const files: AnalysisFile[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    // Only analyze code files (filter by extension)
    const filename = entry.entryName;
    // Supported extensions (add more as needed)
    if (!/\.(py|js|ts|java|c|cpp|go|rb|php|cs)$/i.test(filename)) continue;
    const content = entry.getData().toString('utf-8');
    files.push({ filename, content });
    // Ensure directory exists in /tmp before writing
    const tempFilePath = path.join('/tmp', filename);
    const tempDir = path.dirname(tempFilePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  }

  if (files.length === 0) {
    return { results: [], error: 'No supported code files found in zip.' };
  }

  // Use existing analysis logic
  return await analyzeFiles({ files });
} 