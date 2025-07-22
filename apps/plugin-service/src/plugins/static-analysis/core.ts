import type { CriterionData } from "@/plugins/data";
import type { StaticAnalysisConfig } from "@/plugins/static-analysis/config";
import type { CliOutput } from "@/plugins/static-analysis/semgrep-output";
import path from "node:path";
import process from "node:process";
import {
  getBlobNameParts,
  getBlobNameRest,
} from "@grading-system/utils/azure-storage-blob";
import { LocalCommandExecutor } from "@grading-system/utils/local-command";
import logger from "@grading-system/utils/logger";
import { errAsync, okAsync, Result, ResultAsync, safeTry } from "neverthrow";
import { downloadBlobBatch, submissionStore } from "@/lib/blob-storage";
import { cleanTempDirectory, symlinkFiles } from "@/lib/file";
import { ErrorWithCriterionInfo } from "@/plugins/error";
import { rulesetMap, staticAnalysisConfigSchema } from "@/plugins/static-analysis/config";
import { getTypedConfig } from "@/services/config";

const workspaceRoot = path.join(process.cwd(), "..", "..");
const pluginToolProjectPath = path.join(
  workspaceRoot,
  "libs",
  "plugin-tools",
  "static-analysis",
);
const pluginToolPath = "uv";

const tool = new LocalCommandExecutor({
  path: pluginToolPath,
});

export function gradeSubmission(data: {
  attachments: string[];
  metadata: Record<string, unknown>;
  criterionDataList: CriterionData[];
  attemptId: string;
}) {
  return safeTry(async function* () {
    const allBlobNames = data.criterionDataList.flatMap(
      (criterionData) => criterionData.fileRefs,
    );

    const { downloadDir, blobNameRoot } = yield* downloadBlobBatch(
      submissionStore,
      allBlobNames,
      2,
      `download-${data.attemptId}`,
    );

    const { rest: submissionRef } = getBlobNameParts(blobNameRoot);

    const symlinkPromises = data.criterionDataList.map((criterionData) => {
      const blobNameRestList = Result.combine(
        criterionData.fileRefs.map((blobName) => getBlobNameRest(blobName, blobNameRoot)),
      );

      if (blobNameRestList.isErr()) {
        return errAsync(
          new ErrorWithCriterionInfo({
            data: { criterionName: criterionData.criterionName },
            cause: blobNameRestList.error,
          }),
        );
      }

      const symlinkPromise = symlinkFiles(
        downloadDir,
        blobNameRestList.value,
        `download-${data.attemptId}-${criterionData.criterionName}`,
      );

      const configPromise = getTypedConfig(
        criterionData.configuration,
        staticAnalysisConfigSchema,
      );

      return ResultAsync.combine([symlinkPromise, configPromise])
        .map((value) => {
          return {
            criterionData,
            fileList: blobNameRestList.value,
            directory: value[0].path,
            config: value[1],
          };
        })
        .mapErr((error) => {
          logger.info(`internal: Failed to grade ${criterionData.criterionName}:`, error);

          return new ErrorWithCriterionInfo({
            data: { criterionName: criterionData.criterionName },
            cause: error,
          });
        });
    });

    logger.debug("info:", {
      submissionRef,
      blobNameRoot,
    });

    function toFileRef(filePath: string) {
      return path.join(submissionRef, filePath);
    }

    const gradeCriterionPromises = symlinkPromises.map((promise) =>
      promise.andThen((value) => {
        function clean() {
          cleanTempDirectory(value.directory).orTee((error) => {
            console.error(`Failed to clean temporary directory`, error);
          });
        }
        return gradeCriterion({
          attemptId: data.attemptId,
          criterionData: value.criterionData,
          fileList: value.fileList,
          directory: value.directory,
          config: value.config,
          stripFunc: (fullPath) => fullPath.replace(`${value.directory}/`, ""),
        })
          .mapErr((error) => {
            clean();
            return new ErrorWithCriterionInfo({
              data: { criterionName: value.criterionData.criterionName },
              message: `Failed to grade criterion ${value.criterionData.criterionName}`,
              cause: error,
            });
          })
          .map((result) => {
            clean();

            const scannedFilesSet = new Set(result.scannedFiles);
            const ignoredFiles = [];
            for (const filePath of value.fileList) {
              if (!scannedFilesSet.has(filePath)) {
                ignoredFiles.push(toFileRef(filePath));
              }
            }

            return {
              criterion: value.criterionData.criterionName,
              score: result.score,
              feedback: result.feedbacks.map((item) => ({
                ...item,
                fileRef: toFileRef(item.filePath),
              })),
              ignoredFiles,
            };
          });
      }),
    );

    return okAsync(gradeCriterionPromises);
  });
}

const EXPERIMENTAL_MODE = true;

export function gradeCriterion(data: {
  attemptId: string;
  criterionData: CriterionData;
  fileList: string[];
  directory: string;
  config: StaticAnalysisConfig;
  stripFunc: (filePath: string) => string;
}) {
  return safeTry(async function* () {
    const args = ["run", "semgrep", "scan", data.directory];

    if (EXPERIMENTAL_MODE) {
      args.push("--experimental");
    }

    if (data.config.crossFileAnalysis) {
      args.push("--pro");
    }

    args.push("--json", "--quiet");

    const execResult = yield* tool.execute(args, {
      cwd: pluginToolProjectPath,
      // cwd: data.directory,
    });

    const { results, paths } = JSON.parse(execResult.stdout) as CliOutput;

    let score = 100;
    for (const result of results) {
      const severity = result.extra.severity;

      switch (severity) {
        case "CRITICAL":
          score -= data.config.deductionMap.critical;
          break;
        case "ERROR":
          score -= data.config.deductionMap.error;
          break;
        case "WARNING":
          score -= data.config.deductionMap.warning;
          break;
        case "INFO":
          score -= data.config.deductionMap.info;
          break;
      }
    }

    score = Math.max(score, 0);
    const feedbacks = results.map((result) => {
      const position = {
        fromLine: result.start.line,
        fromCol: result.start.col,
        toLine: result.end.line,
        toCol: result.end.col,
      };
      const message = result.extra.message || undefined;

      return {
        filePath: data.stripFunc(result.path),
        position,
        severity: result.extra.severity,
        message,
      };
    });

    return okAsync({
      score,
      feedbacks,
      scannedFiles: paths.scanned.map(data.stripFunc),
    });
  });
}

function createRuleFlags(config: StaticAnalysisConfig) {
  const flags = [];
  if (config.preset) {
    if (config.preset.type === "auto") {
      flags.push("--config=auto");
    } else {
      flags.push(
        ...rulesetMap[config.preset.type].map((ruleset) => `--config="${ruleset}"`),
      );
    }
  }

  if (config.additionalRulesets) {
    for (const ruleset of config.additionalRulesets) {
      flags.push(`--config="${ruleset}"`);
    }
  }

  logger.debug("Semgrep flags:", flags);

  return flags;
}

// import type { AnalysisRequest, AnalysisResponse, FileAnalysisResult, SemgrepFinding } from './types';
// import { exec, execSync } from 'node:child_process';
// import fs from 'node:fs';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Simple language detection by file extension
// const extensionToLanguage: Record<string, string> = {
//   '.py': 'python',
//   '.js': 'javascript',
//   '.ts': 'typescript',
//   '.java': 'java',
//   '.c': 'c',
//   '.cpp': 'cpp',
//   '.go': 'go',
//   '.rb': 'ruby',
//   '.php': 'php',
//   '.cs': 'csharp',
//   // Add more as needed
// };

// export function detectLanguage(filename: string): string {
//   const ext = path.extname(filename).toLowerCase();
//   if (extensionToLanguage[ext]) {
//     return extensionToLanguage[ext];
//   }
//   throw new Error(`Unsupported file extension: ${ext}`);
// }

// // Score calculation: severity-based
// function calculateScore(findings: SemgrepFinding[]): number {
//   if (!findings.length) return 100;
//   let score = 100;
//   for (const finding of findings) {
//     switch ((finding.severity || '').toUpperCase()) {
//       case 'ERROR':
//         score -= 5;
//         break;
//       case 'WARNING':
//         score -= 3;
//         break;
//       case 'INFO':
//         score -= 1;
//         break;
//       default:
//         score -= 2; // fallback for unknown severity
//     }
//   }
//   return Math.max(0, score);
// }

// // Run Semgrep on a single file
// async function runSemgrepOnFile(filePath: string, language: string, rules?: string): Promise<SemgrepFinding[]> {
//   // TODO: Support custom rules (write to temp file if provided)
//   return new Promise((resolve, reject) => {
//     const args = [
//       '--json',
//       '--quiet',
//       '--lang', language,
//       filePath,
//     ];
//     const cmd = `semgrep ${args.join(' ')}`;
//     exec(cmd, (error, stdout, stderr) => {
//       if (error) {
//         return reject(stderr || error.message);
//       }
//       try {
//         const result = JSON.parse(stdout);
//         const findings: SemgrepFinding[] = (result.results || []).map((r: any) => ({
//           ruleId: r.check_id,
//           message: r.extra?.message || '',
//           path: r.path,
//           startLine: r.start?.line || 0,
//           endLine: r.end?.line || 0,
//           severity: r.extra?.severity || 'INFO',
//           metadata: r.extra?.metadata || {},
//         }));
//         resolve(findings);
//       } catch (e) {
//         reject('Failed to parse Semgrep output');
//       }
//     });
//   });
// }

// function getRuleFileForLanguage(language: string) {
//   const rulePath = path.join(__dirname, "rules", `${language}.yml`);
//   if (!fs.existsSync(rulePath)) {
//     throw new Error(`No rule file found for language: ${language}`);
//   }
//   return rulePath;
// }

// // Main analysis function
// export async function analyzeFiles(req: AnalysisRequest): Promise<AnalysisResponse> {
//   const results: FileAnalysisResult[] = [];
//   for (const file of req.files) {
//     const language = detectLanguage(file.filename);
//     const tempFilePath = path.join("/tmp", file.filename);
//     fs.writeFileSync(tempFilePath, file.content);

//     // Python: Syntax check first
//     if (language === "python") {
//       let syntaxError = false;
//       let syntaxMessage = "";
//       try {
//         execSync(`python3 -m py_compile ${tempFilePath}`);
//       } catch (e: any) {
//         syntaxError = true;
//         syntaxMessage = e.stderr?.toString() || e.message;
//       }
//       if (syntaxError) {
//         results.push({
//           filename: file.filename,
//           language,
//           findings: [],
//           score: 0,
//           error: `Syntax error: ${syntaxMessage}`,
//         });
//         fs.unlinkSync(tempFilePath);
//         continue;
//       }
//       // If syntax OK, run Semgrep with custom rules
//       try {
//         const pythonRuleFile = path.join(__dirname, "rules", "python.yml");
//         const semgrepCmd = `semgrep --config=${pythonRuleFile} ${tempFilePath} --json`;
//         const output = execSync(semgrepCmd);
//         const findingsObj = JSON.parse(output.toString());
//         const findings = findingsObj.results || [];
//         const score = calculateScore(findings);
//         results.push({
//           filename: file.filename,
//           language,
//           findings,
//           score,
//         });
//       } catch (err) {
//         const error: any = err;
//         results.push({
//           filename: file.filename,
//           language,
//           findings: [],
//           score: 0,
//           error: error.stdout?.toString() || error.message,
//         });
//       }
//       fs.unlinkSync(tempFilePath);
//       continue;
//     }

//     // Other languages: existing behavior
//     const ruleFile = getRuleFileForLanguage(language);
//     try {
//       const semgrepCmd = `semgrep --config=${ruleFile} ${tempFilePath} --json`;
//       const output = execSync(semgrepCmd);
//       const findingsObj = JSON.parse(output.toString());
//       const findings = findingsObj.results || [];
//       const score = calculateScore(findings);
//       results.push({
//         filename: file.filename,
//         language,
//         findings,
//         score,
//       });
//       fs.unlinkSync(tempFilePath);
//     } catch (err) {
//       const error: any = err;
//       if (error.stdout) {
//         console.error('Semgrep error stdout:', error.stdout.toString());
//       }
//       if (error.stderr) {
//         console.error('Semgrep error stderr:', error.stderr.toString());
//       }
//       results.push({
//         filename: file.filename,
//         language,
//         findings: [],
//         score: 0,
//         error: error.stdout?.toString() || error.message,
//       });
//       fs.unlinkSync(tempFilePath);
//     }
//   }
//   return { results };
// }
