import { z } from "zod";

export const rulesetMap = {
  "c-cpp": ["p/c"],
  "c-sharp": ["p/csharp"],
  go: ["p/go", "p/gosec"],
  java: ["p/java"],
  javascript: ["p/javascript"],
  typescript: ["p/typescript"],
  python: ["p/python"],
};

export const rulesetSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("c-cpp") }),
  z.object({ type: z.literal("c-sharp") }),
  z.object({ type: z.literal("go") }),
  z.object({ type: z.literal("java") }),
  z.object({ type: z.literal("javascript") }),
  z.object({ type: z.literal("typescript") }),
  z.object({ type: z.literal("python") }),
  z.object({ type: z.literal("auto") }),
]);

export const staticAnalysisConfigSchema = z
  .object({
    type: z.literal("static-analysis"),
    crossFileAnalysis: z
      .boolean()
      .default(true)
      .describe("Whether to enable cross-file analysis"),
    preset: rulesetSchema.describe("Semgrep ruleset to use for analysis").optional(),
    additionalRulesets: z
      .array(z.string())
      .optional()
      .describe("Semgrep rulesets from the registry, required if 'preset' is not set")
      .optional(),
    deductionMap: z.object({
      critical: z.number().default(20),
      error: z.number().default(15),
      warning: z.number().default(2),
      info: z.number().default(0),
    }),
  })
  .refine((data) => data.preset === undefined && data.additionalRulesets === undefined, {
    message: "Either 'preset' or 'additionalRulesets' must be set",
  });

export type StaticAnalysisConfig = z.infer<typeof staticAnalysisConfigSchema>;
