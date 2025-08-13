import { z } from "zod";

export const typeCoverageConfigSchema = z.object({
  type: z.literal("type-coverage"),
  version: z.literal(1).default(1),
  deductionMultiplier: z
    .number()
    .min(1)
    .default(10)
    .describe("Deduct by the amount of % type coverage missing"),
});

export type TypeCoverageConfig = z.infer<typeof typeCoverageConfigSchema>;
