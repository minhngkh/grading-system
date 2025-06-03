import { z } from "zod";

export enum GradingStatus {
  Created = "Created",
  Started = "Started",
  Graded = "Graded",
  Completed = "Completed",
  Failed = "Failed",
}

export const SelectorSchema = z.object({
  criterion: z.string({ required_error: "Criteria name is required" }),
  pattern: z
    .string({ required_error: "Pattern is required" })
    .min(1, { message: "Pattern cannot be empty" }),
});

export const SubmissionSchema = z.object({
  reference: z.string(),
});

export const GradingSchema = z.object({
  id: z.string({ required_error: "Grading ID is required" }),
  rubricId: z.string().optional(),
  scaleFactor: z.number().min(1).optional(),
  selectors: z
    .array(SelectorSchema, {
      invalid_type_error: "Selectors must be an array",
    })
    .min(1, { message: "Selectors cannot be empty" }),
  status: z.nativeEnum(GradingStatus).optional(),
  lastModified: z.date().optional(),
  submissions: z.array(SubmissionSchema),
});

export type CriteriaSelector = z.infer<typeof SelectorSchema>;
export type GradingAttempt = z.infer<typeof GradingSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
