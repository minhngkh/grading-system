import { z } from "zod";

export const ScoreBreakdownSchema = z.object({
  id: z.string().optional(),
  criterionName: z.string(),
  tag: z.string(),
  rawScore: z.number(),
});

export const FeedbackItemSchema = z.object({
  id: z.string().optional(),
  criterion: z.string(),
  fileRef: z.string(),
  fromLine: z.number(),
  toLine: z.number(),
  fromCol: z.number(),
  toCol: z.number(),
  comment: z.string(),
  tag: z.string(),
});

export const AssessmentSchema = z.object({
  id: z.string(),
  gradingId: z.string(),
  scaleFactor: z.number(),
  submissionReference: z.string(),
  rawScore: z.number(),
  adjustedCount: z.number().optional(),
  scoreBreakdowns: z.array(ScoreBreakdownSchema),
  feedbacks: z.array(FeedbackItemSchema),
});

export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
export type FeedbackItem = z.infer<typeof FeedbackItemSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
