import { z } from "zod";

export const ScoreBreakdownSchema = z.object({
  criterionName: z.string(),
  performanceTag: z.string(),
  rawScore: z.number(),
});

const BaseFeedbackSchema = z.object({
  id: z.string().optional(),
  criterion: z.string(),
  fileRef: z.string(),
  comment: z.string(),
  tag: z.string(),
});

const TextFeedbackSchema = BaseFeedbackSchema.extend({
  type: z.literal("text"),
  fromLine: z.number(),
  toLine: z.number(),
  fromCol: z.number(),
  toCol: z.number(),
});

const ImageFeedbackSchema = BaseFeedbackSchema.extend({
  type: z.literal("image"),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const PdfFeedbackSchema = BaseFeedbackSchema.extend({
  type: z.literal("pdf"),
  page: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const FeedbackSchema = z.object({
  criterion: z.string(),
  fileRef: z.string(),
  fromLine: z.number().optional(),
  toLine: z.number().optional(),
  fromCol: z.number().optional(),
  toCol: z.number().optional(),
  comment: z.string(),
  tag: z.string(),
});

export enum AssessmentState {
  Created,
  AutoGradingStarted,
  AutoGradingFinished,
  AutoGradingFailed,
  Completed,
}

export const AssessmentSchema = z.object({
  id: z.string(),
  gradingId: z.string(),
  submissionReference: z.string(),
  rawScore: z.number(),
  adjustedCount: z.number().optional(),
  scoreBreakdowns: z.array(ScoreBreakdownSchema),
  feedbacks: z.array(FeedbackSchema),
  status: z.nativeEnum(AssessmentState),
});

export type Assessment = z.infer<typeof AssessmentSchema>;
export type FeedbackItem = z.infer<typeof FeedbackSchema>;
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
export type TextFeedback = z.infer<typeof TextFeedbackSchema>;
export type ImageFeedback = z.infer<typeof ImageFeedbackSchema>;
export type PdfFeedback = z.infer<typeof PdfFeedbackSchema>;
