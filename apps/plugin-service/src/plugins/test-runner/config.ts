import { z } from "zod";

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
});
