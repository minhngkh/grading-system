import z from "zod";

export const PluginSchema = z.object({
  alias: z.string().min(1, "Plugin alias is required"),
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
  language: z.string().min(1, "Language is required"),
  initCommand: z.string().min(1, "Install command is required"),
  runCommand: z.string().min(1, "Run command is required"),
  environmentVariables: z.record(z.string(), z.string()).optional().default({}),
  testCases: z
    .array(CodeRunnerTestCaseSchema)
    .min(1, "At least one test case is required")
    .refine(
      (testCases) => testCases.every((tc) => tc.input.trim() && tc.expectedOutput.trim()),
      { message: "All test cases must have both input and expected output" },
    ),
});

export type Plugin = z.infer<typeof PluginSchema>;
export type CodeRunnerTestCase = z.infer<typeof CodeRunnerTestCaseSchema>;
export type CodeRunnerConfig = z.infer<typeof CodeRunnerConfigSchema>;
