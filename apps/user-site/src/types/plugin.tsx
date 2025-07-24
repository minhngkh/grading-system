import z from "zod";

export const runningSettingsSchema = z.object({
  cpuLimit: z
    .number()
    .default(10 * 1000000000)
    .describe("CPU time limit for the program in nanoseconds"),
  clockLimit: z
    .number()
    .optional()
    .describe("Clock time limit for the program in seconds"),
  memoryLimit: z
    .number()
    .default(256 * 1024 * 1024)
    .describe("Memory limit for the program in megabytes"),
  procLimit: z.number().default(50).describe("Number of processes limit for the program"),
});

export const advancedSettingsSchema = z.object({
  initStep: runningSettingsSchema.default({}),
  runStep: runningSettingsSchema.default({}),
  // combineStdoutStderr: z
  //   .boolean()
  //   .default(false)
  //   .describe("Whether to combine stdout and stderr into a single output"),
});

export const PluginSchema = z.object({
  id: z.string().min(1, "Plugin alias is required"),
  name: z.string().min(1, "Plugin name is required"),
  description: z.string().min(1, "Plugin description is required"),
  categories: z.array(z.string().min(1, "Plugin category is required")),
  enabled: z.boolean().default(true),
});

export const CodeRunnerTestCaseSchema = z.object({
  input: z.string().min(1, "Test case input cannot be empty"),
  expectedOutput: z.string().min(1, "Test case expected output cannot be empty"),
});

export const CodeRunnerConfigSchema = z.object({
  initCommand: z.string().optional().describe("Install dependencies command"),
  runCommand: z.string().min(1, "Run command is required"),
  environmentVariables: z.record(z.string(), z.string()).optional(),
  testCases: z
    .array(CodeRunnerTestCaseSchema)
    .min(1, "At least one test case is required")
    .refine(
      (testCases) => testCases.every((tc) => tc.input.trim() && tc.expectedOutput.trim()),
      { message: "All test cases must have both input and expected output" },
    ),
  advancedSettings: advancedSettingsSchema
    .default({})
    .describe("Advanced settings for the test runner"),
  outputComparison: z.object({
    ignoreWhitespace: z
      .boolean()
      .default(false)
      .describe("Ignore whitespace differences in output"),
    ignoreLineEndings: z
      .boolean()
      .default(false)
      .describe("Ignore line ending differences in output"),
    trim: z.boolean().default(false).describe("Trim output before comparison"),
    ignoreCase: z.boolean().default(false).describe("Ignore case differences in output"),
  }).default({}),
});

export enum StaticAnalysisPreset {
  "C/C++" = "c-cpp",
  "Python" = "python",
  "CSharp" = "c-sharp",
  "Go" = "go",
  "Java" = "java",
  "JavaScript" = "javascript",
  "TypeScript" = "typescript",
  "Auto Detect" = "auto",
}

export enum StaticAnalysisDeductionType {
  "critical" = "critical",
  "error" = "error",
  "warning" = "warning",
  "info" = "info",
}

export const StaticAnalysisConfigSchema = z.object({
  crossFileAnalysis: z.boolean().default(false),
  preset: z.nativeEnum(StaticAnalysisPreset).default(StaticAnalysisPreset["Auto Detect"]),
  additionalRulesets: z.array(z.string()).optional(),
  deductionMap: z
    .record(
      z.nativeEnum(StaticAnalysisDeductionType),
      z.number().min(0, "Deduction must be a non-negative number"),
    )
    .default({
      [StaticAnalysisDeductionType.critical]: 20,
      [StaticAnalysisDeductionType.error]: 15,
      [StaticAnalysisDeductionType.warning]: 2,
      [StaticAnalysisDeductionType.info]: 0,
    }),
});

export type Plugin = z.infer<typeof PluginSchema>;
export type CodeRunnerTestCase = z.infer<typeof CodeRunnerTestCaseSchema>;
export type CodeRunnerConfig = z.infer<typeof CodeRunnerConfigSchema>;
export type StaticAnalysisConfig = z.infer<typeof StaticAnalysisConfigSchema>;
