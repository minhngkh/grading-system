import { z } from "zod";

export enum Grader {
  aiGrader = "AI",
  teacher = "Teacher",
}

export enum ScoreBreakdownStatus {
  Manual = "Mannual",
  Failed = "Failed",
  Graded = "Graded",
}

export const ScoreBreakdownSchema = z.object({
  criterionName: z.string(),
  performanceTag: z.string(),
  grader: z.string(),
  rawScore: z.number(),
  metadata: z.array(z.string()).optional(),
  status: z.nativeEnum(ScoreBreakdownStatus),
});

const BaseFeedbackSchema = z.object({
  id: z.string().optional(),
  criterion: z.string(),
  fileRef: z.string(),
  comment: z.string(),
  tag: z.string(),
});

const TextLocationSchema = z.object({
  type: z.literal("text"),
  fromLine: z.number(),
  toLine: z.number(),
  fromCol: z.number().optional(),
  toCol: z.number().optional(),
});

const PdfLocationSchema = z.object({
  type: z.literal("pdf"),
  page: z.number(),
});

const ImageLocationSchema = z.object({
  type: z.literal("image"),
});

export const LocationDataSchema = z.discriminatedUnion("type", [
  TextLocationSchema,
  PdfLocationSchema,
  ImageLocationSchema,
]);

export const FeedbackSchema = BaseFeedbackSchema.extend({
  locationData: LocationDataSchema,
});

export const FeedbackListSchema = z.array(FeedbackSchema);

export enum AssessmentState {
  Created = "Created",
  AutoGradingStarted = "AutoGradingStarted",
  AutoGradingFinished = "AutoGradingFinished",
  AutoGradingFailed = "AutoGradingFailed",
  ManualGradingRequired = "ManualGradingRequired",
  Completed = "Completed",
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
  lastModified: z.date().optional(),
  createdAt: z.date(),
});

export type ScoreAdjustment = {
  adjustmentSource: Grader;
  score: number;
  createdAt: Date;
  scoreBreakdowns: ScoreBreakdown[];
  deltaScore: number;
};

export type Assessment = z.infer<typeof AssessmentSchema>;
export type FeedbackItem = z.infer<typeof FeedbackSchema>;
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
export type LocationData = z.infer<typeof LocationDataSchema>;
