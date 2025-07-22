import { z } from "zod";

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

export const testCaseSchema = z.object({
  input: z.string().describe("stdin"),
  output: z.string().describe("Expected stdout"),
  description: z.string().optional().describe("Description of the test case"),
});

export const testRunnerConfigSchema = z.object({
  type: z.literal("test-runner"),
  version: z.literal(1).default(1),
  runCommand: z.string().describe("Command to run tests"),
  initCommand: z
    .string()
    .optional()
    .describe("Command to build the project before running tests"),
  testCases: z.array(testCaseSchema).describe("Test cases to run"),
  environmentVariables: z
    .record(z.string())
    .optional()
    .describe("Environment variables to set for the program"),
  advancedSettings: advancedSettingsSchema
    .default({})
    .describe("Advanced settings for the test runner"),
});

export type TestRunnerConfig = z.infer<typeof testRunnerConfigSchema>;
