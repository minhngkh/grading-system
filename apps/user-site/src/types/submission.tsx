import { Criteria, Rubric } from "./rubric";
import { z } from "zod";

// 1. Enum GradingStatus
export const GradingStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);
export type GradingStatus = z.infer<typeof GradingStatusSchema>;

// 2. ScoreResult1
export const ScoreResult1Schema = z.object({
  submissionBreakDownId: z.string(),
  pointsAwarded: z.number(),
  comments: z.string(), // Keep comments as a string for individual breakdowns
  gradedBy: z.string(),
  source: z.enum(["AI", "HUMAN", "PLUGIN"]),
  updatedAt: z.string(),
});
export type ScoreResult1 = z.infer<typeof ScoreResult1Schema>;

// 3. SubmissionBreakdown1
export const SubmissionBreakdown1Schema = z.object({
  id: z.string(),
  processedContent: z.string(),
  criterionId: z.string(),
  target: z.string().optional(),
  type: z.enum(["code", "essay"]),
  fileReference: z.string().optional(),
  adjustmentCount: z.number(),
  score: ScoreResult1Schema.optional(),
});
export type SubmissionBreakdown1 = z.infer<typeof SubmissionBreakdown1Schema>;

// 4. Submission
export const SubmissionSchema = z.object({
  id: z.string(),
  submittedBy: z.string(),
  submissionTimestamp: z.string(),
  rubricId: z.string(),
  gradingStatus: GradingStatusSchema,
  breakdowns: z.array(SubmissionBreakdown1Schema),
});
export type Submission = z.infer<typeof SubmissionSchema>;

//DocumentLocation
export const DocumentLocationSchema = z.object({
  id: z.string(),
  fromLine: z.number(),
  toLine: z.number(),
  fromCol: z.number(),
  toCol: z.number(),
});
export type DocumentLocation = z.infer<typeof DocumentLocationSchema>;

//Feedback
export const FeedbackSchema = z.object({
  id: z.string(),
  DocumentLocation: DocumentLocationSchema,
  comment: z.string(),
  tag: z.enum(["info", "notice", "tip", "caution"]).optional(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

// 5. CriterionGradingResult
export const CriterionGradingResultSchema = z.object({
  id: z.string(),
  gradingResultId: z.string(),
  criterionId: z.string(),
  score: z.number(),
  feedback: z.array(FeedbackSchema), // Feedback is specific to CriterionGradingResult
});
export type CriterionGradingResult = z.infer<typeof CriterionGradingResultSchema>;

// 6. GradingResult
export const GradingResultSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  rubricId: z.string(),
  gradingStatus: GradingStatusSchema,
  criterionResults: z.array(CriterionGradingResultSchema),
});
export type GradingResult = z.infer<typeof GradingResultSchema>;

//7. TestCase
export const TestCaseSchema = z.object({
  id: z.string(),
  expected: z.string(),
  actual: z.string(),
  result: z.enum(["Passed", "Failed"]),
});
export type TestCase = z.infer<typeof TestCaseSchema>;
