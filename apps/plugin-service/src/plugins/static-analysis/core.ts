import type { AnalysisRequest, AnalysisResponse, FileAnalysisResult, SemgrepFinding } from './types';
import { exec, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple language detection by file extension
const extensionToLanguage: Record<string, string> = {
  '.py': 'python',
  '.js': 'javascript',
  '.ts': 'typescript',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.go': 'go',
  '.rb': 'ruby',
  '.php': 'php',
  '.cs': 'csharp',
  // Add more as needed
};

export function detectLanguage(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (extensionToLanguage[ext]) {
    return extensionToLanguage[ext];
  }
  throw new Error(`Unsupported file extension: ${ext}`);
}

// Score calculation: severity-based
function calculateScore(findings: SemgrepFinding[]): number {
  if (!findings.length) return 100;
  let score = 100;
  for (const finding of findings) {
    switch ((finding.severity || '').toUpperCase()) {
      case 'ERROR':
        score -= 5;
        break;
      case 'WARNING':
        score -= 3;
        break;
      case 'INFO':
        score -= 1;
        break;
      default:
        score -= 2; // fallback for unknown severity
    }
  }
  return Math.max(0, score);
}

// Run Semgrep on a single file
async function runSemgrepOnFile(filePath: string, language: string, rules?: string): Promise<SemgrepFinding[]> {
  // TODO: Support custom rules (write to temp file if provided)
  return new Promise((resolve, reject) => {
    const args = [
      '--json',
      '--quiet',
      '--lang', language,
      filePath,
    ];
    const cmd = `semgrep ${args.join(' ')}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        return reject(stderr || error.message);
      }
      try {
        const result = JSON.parse(stdout);
        const findings: SemgrepFinding[] = (result.results || []).map((r: any) => ({
          ruleId: r.check_id,
          message: r.extra?.message || '',
          path: r.path,
          startLine: r.start?.line || 0,
          endLine: r.end?.line || 0,
          severity: r.extra?.severity || 'INFO',
          metadata: r.extra?.metadata || {},
        }));
        resolve(findings);
      } catch (e) {
        reject('Failed to parse Semgrep output');
      }
    });
  });
}

function getRuleFileForLanguage(language: string) {
  const rulePath = path.join(__dirname, "rules", `${language}.yml`);
  if (!fs.existsSync(rulePath)) {
    throw new Error(`No rule file found for language: ${language}`);
  }
  return rulePath;
}

// Main analysis function
export async function analyzeFiles(req: AnalysisRequest): Promise<AnalysisResponse> {
  const results: FileAnalysisResult[] = [];
  for (const file of req.files) {
    const language = detectLanguage(file.filename);
    const tempFilePath = path.join("/tmp", file.filename);
    fs.writeFileSync(tempFilePath, file.content);

    // Python: Syntax check first
    if (language === "python") {
      let syntaxError = false;
      let syntaxMessage = "";
      try {
        execSync(`python3 -m py_compile ${tempFilePath}`);
      } catch (e: any) {
        syntaxError = true;
        syntaxMessage = e.stderr?.toString() || e.message;
      }
      if (syntaxError) {
        results.push({
          filename: file.filename,
          language,
          findings: [],
          score: 0,
          error: `Syntax error: ${syntaxMessage}`,
        });
        fs.unlinkSync(tempFilePath);
        continue;
      }
      // If syntax OK, run Semgrep with custom rules
      try {
        const pythonRuleFile = path.join(__dirname, "rules", "python.yml");
        const semgrepCmd = `semgrep --config=${pythonRuleFile} ${tempFilePath} --json`;
        const output = execSync(semgrepCmd);
        const findingsObj = JSON.parse(output.toString());
        const findings = findingsObj.results || [];
        const score = calculateScore(findings);
        results.push({
          filename: file.filename,
          language,
          findings,
          score,
        });
      } catch (err) {
        const error: any = err;
        results.push({
          filename: file.filename,
          language,
          findings: [],
          score: 0,
          error: error.stdout?.toString() || error.message,
        });
      }
      fs.unlinkSync(tempFilePath);
      continue;
    }

    // Other languages: existing behavior
    const ruleFile = getRuleFileForLanguage(language);
    try {
      const semgrepCmd = `semgrep --config=${ruleFile} ${tempFilePath} --json`;
      const output = execSync(semgrepCmd);
      const findingsObj = JSON.parse(output.toString());
      const findings = findingsObj.results || [];
      const score = calculateScore(findings);
      results.push({
        filename: file.filename,
        language,
        findings,
        score,
      });
      fs.unlinkSync(tempFilePath);
    } catch (err) {
      const error: any = err;
      if (error.stdout) {
        console.error('Semgrep error stdout:', error.stdout.toString());
      }
      if (error.stderr) {
        console.error('Semgrep error stderr:', error.stderr.toString());
      }
      results.push({
        filename: file.filename,
        language,
        findings: [],
        score: 0,
        error: error.stdout?.toString() || error.message,
      });
      fs.unlinkSync(tempFilePath);
    }
  }
  return { results };
}
