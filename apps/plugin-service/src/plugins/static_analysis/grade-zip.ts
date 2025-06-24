import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';
import { analyzeFiles } from './core';

async function gradeZip(zipFilePath: string) {
  // 1. Extract zip
  const extractDir = path.join('/tmp', `extract_${Date.now()}`);
  await fs.mkdir(extractDir, { recursive: true });
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(extractDir, true);

  // 2. Read all files in the extracted directory (non-recursive for simplicity)
  const files = [];
  for (const fileName of await fs.readdir(extractDir)) {
    const filePath = path.join(extractDir, fileName);
    const stat = await fs.stat(filePath);
    if (stat.isFile()) {
      files.push({
        filename: fileName,
        content: await fs.readFile(filePath, 'utf-8'),
      });
    }
  }

  // 3. Run Semgrep grading
  const result = await analyzeFiles({ files });
  return result;
}

// CLI usage: tsx grade-zip.ts path/to/your.zip
if (require.main === module) {
  const zipFilePath = process.argv[2];
  if (!zipFilePath) {
    console.error('Usage: tsx grade-zip.ts <zip-file-path>');
    process.exit(1);
  }
  gradeZip(zipFilePath)
    .then((result) => {
      console.log('Semgrep grading result:');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error('Error grading zip:', err);
      process.exit(1);
    });
} 