import { analyzeFiles } from './core';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeZipBuffer } from './grade-zip';
import AdmZip from 'adm-zip';

const testFiles = [
  { filename: 'python_test.py', language: 'python' },
  { filename: 'c_test.c', language: 'c' },
  { filename: 'cpp_test.cpp', language: 'cpp' },
  { filename: 'csharp_test.cs', language: 'csharp' },
  { filename: 'javascript_test.js', language: 'javascript' },
];



async function runZipAnalysisTest() {
  const zip = new AdmZip();
  // Add all test files to the zip
  for (const { filename } of testFiles) {
    const filePath = path.join(__dirname, 'code_test', filename);
    if (fs.existsSync(filePath)) {
      zip.addFile(filename, fs.readFileSync(filePath));
    }
  }
  const zipBuffer = zip.toBuffer();
  const result = await analyzeZipBuffer(zipBuffer);
  console.log('\n===== ZIP Analysis Test Results =====');
  console.log(JSON.stringify(result, null, 2));
}

async function runCustomZipFileTest() {
  const dirname = path.dirname(new URL(import.meta.url).pathname);
  const zipPath = path.join(dirname, 'code_test', 'GK-21120022.zip');
  if (!fs.existsSync(zipPath)) {
    console.error('Custom zip file not found:', zipPath);
    return;
  }
  const zipBuffer = fs.readFileSync(zipPath);
  const result = await analyzeZipBuffer(zipBuffer);
  console.log('\n===== Custom ZIP File Analysis Results =====');
  console.log(JSON.stringify(result, null, 2));
}

// runZipAnalysisTest();
runCustomZipFileTest();
