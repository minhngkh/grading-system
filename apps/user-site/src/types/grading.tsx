import { z } from "zod";

export enum GradingStatus {
  Created = "Created",
  Started = "Started",
  Graded = "Graded",
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
  name: z.string({ required_error: "Grading name is required" }),
  rubricId: z.string().nonempty({
    message: "Rubric is required",
  }),
  scaleFactor: z
    .number()
    .min(1, {
      message: "Scale factor must be at least 1",
    })
    .optional(),
  selectors: z.array(SelectorSchema).min(1, { message: "Selectors cannot be empty" }),
  status: z.nativeEnum(GradingStatus),
  lastModified: z.date().optional(),
  createdAt: z.date(),
  submissions: z.array(SubmissionSchema).min(1, {
    message: "At least one submission is required",
  }),
});

export type CriteriaSelector = z.infer<typeof SelectorSchema>;
export type GradingAttempt = z.infer<typeof GradingSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
