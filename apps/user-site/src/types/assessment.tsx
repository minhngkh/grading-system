import { z } from "zod";

export const ScoreBreakdownSchema = z.object({
  criterionName: z.string(),
  tag: z.string(),
  rawScore: z.number(),
});

const BaseFeedbackSchema = z.object({
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

export const FeedbackItemSchema = z.union([
  TextFeedbackSchema,
  ImageFeedbackSchema,
  PdfFeedbackSchema,
]);

export const AssessmentSchema = z.object({
  id: z.string(),
  gradingId: z.string(),
  submissionReference: z.string(),
  rawScore: z.number(),
  adjustedCount: z.number().optional(),
  scoreBreakdowns: z.array(ScoreBreakdownSchema),
  feedbacks: z.array(FeedbackItemSchema),
});

export type Assessment = z.infer<typeof AssessmentSchema>;
export type FeedbackItem = z.infer<typeof FeedbackItemSchema>;
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
