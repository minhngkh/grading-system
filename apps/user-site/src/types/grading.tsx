import { z } from "zod";

export enum GradingStatus {
  Created,
  Started,
  Graded,
  Failed,
  Completed,
}

export const SelectorSchema = z.object({
  criterion: z.string({ required_error: "Criteria name is required" }),
  pattern: z
    .string({ required_error: "Pattern is required" })
    .min(1, { message: "Pattern cannot be empty" }),
});

export const GradingSchema = z.object({
  id: z.string({ required_error: "Grading ID is required" }),
  rubricId: z.string({ required_error: "Rubric ID is required" }),
  scaleFactor: z.number().min(1).optional(),
  selectors: z
    .array(SelectorSchema, {
      invalid_type_error: "Selectors must be an array",
    })
    .min(1, { message: "Selectors cannot be empty" }),
  status: z.nativeEnum(GradingStatus).optional(),
});

export type CriteriaSelector = z.infer<typeof SelectorSchema>;
export type GradingAttempt = z.infer<typeof GradingSchema>;
