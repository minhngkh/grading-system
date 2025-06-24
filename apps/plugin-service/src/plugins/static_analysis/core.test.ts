import { analyzeFiles } from './core';
import * as fs from 'fs';
import * as path from 'path';

const testFiles = [
  { filename: 'python_test.py', language: 'python' },
  { filename: 'c_test.c', language: 'c' },
  { filename: 'cpp_test.cpp', language: 'cpp' },
  { filename: 'csharp_test.cs', language: 'csharp' },
  { filename: 'javascript_test.js', language: 'javascript' },
];

// ESM-compatible __dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function runAllLanguageTests() {
  for (const { filename, language } of testFiles) {
    // Single-file test
    const filePath = path.join(__dirname, 'code_test', filename);
    const singleFile = [{ filename, content: fs.readFileSync(filePath, 'utf-8') }];
    const singleReq = { files: singleFile };
    const singleResult = await analyzeFiles(singleReq);
    console.log(`\n===== ${language.toUpperCase()} Single-file Test Results =====`);
    console.log(JSON.stringify(singleResult, null, 2));

    // Multi-file test (if exists)
    const multifileDir = path.join(__dirname, 'code_test', `multifile_${language}`);
    if (fs.existsSync(multifileDir)) {
      const multifileFiles = fs.readdirSync(multifileDir)
        .filter(f => f.endsWith(getFileExtension(language)))
        .map(f => ({
          filename: f,
          content: fs.readFileSync(path.join(multifileDir, f), 'utf-8'),
        }));
      if (multifileFiles.length > 0) {
        const multiReq = { files: multifileFiles };
        const multiResult = await analyzeFiles(multiReq);
        console.log(`\n===== ${language.toUpperCase()} Multi-file Test Results =====`);
        console.log(JSON.stringify(multiResult, null, 2));
      }
    }
  }
}

function getFileExtension(language: string): string {
  switch (language) {
    case 'python': return '.py';
    case 'c': return '.c';
    case 'cpp': return '.cpp';
    case 'csharp': return '.cs';
    case 'javascript': return '.js';
    default: return '';
  }
}

runAllLanguageTests();
