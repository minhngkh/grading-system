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

export const baseStaticAnalysisConfigSchema = z.object({
  type: z.literal("static-analysis"),
  version: z.literal(1).default(1),
  crossFileAnalysis: z
    .boolean()
    .default(false)
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
});

export const checkStaticAnalysisConfigSchema = {
  func: (data: z.infer<typeof baseStaticAnalysisConfigSchema>) =>
    data.preset === undefined &&
    (data.additionalRulesets === undefined || data.additionalRulesets.length === 0),
  message: "Either 'preset' or 'additionalRulesets' must be set",
};

export const staticAnalysisConfigSchema = baseStaticAnalysisConfigSchema.refine(
  checkStaticAnalysisConfigSchema.func,
  { message: checkStaticAnalysisConfigSchema.message },
);

export type StaticAnalysisConfig = z.infer<typeof staticAnalysisConfigSchema>;
