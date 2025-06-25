import type { ServiceEvent } from "@grading-system/utils/event-transporter/core";
import z from "zod";

export const submissionStartedEvent = {
  name: "grading.submission.started",
  schema: z.object({
    assessmentId: z.string(),
    attachments: z.array(z.string()),
    metadata: z.record(z.unknown()),
    criteria: z.array(
      z.object({
        criterionName: z.string(),
        fileRefs: z.array(z.string()),
        levels: z.array(
          z.object({
            tag: z.string(),
            description: z.string(),
            weight: z.coerce.number().int().min(0).max(100),
          }),
        ),
        plugin: z.string(),
        configuration: z.string(),
      }),
    ),
  }),
} satisfies ServiceEvent;

export const submissionGradedEvent = {
  name: "grading.submission.graded",
  schema: z.object({
    assessmentId: z.string(),
    scoreBreakdowns: z.array(
      z.object({
        criterionName: z.string(),
        tag: z.string(),
        rawScore: z.number().int().min(0).max(100),
        plugin: z.string(),
        metadata: z.record(z.unknown()).optional(),
        summary: z.string().optional(),
        feedbackItems: z.array(
          z.object({
            comment: z.string(),
            fileRef: z.string(),
            tag: z.string(),
            fromCol: z.number().int().optional(),
            toCol: z.number().int().optional(),
            fromLine: z.number().int(),
            toLine: z.number().int(),
          }),
        ),
      }),
    ),
    errors: z.array(
      z.object({
        criterionName: z.string(),
        error: z.string(),
      }),
    ),
  }),
} satisfies ServiceEvent;

export const criterionGradingSuccessEvent = {
  name: "grading.criterion.graded",
  schema: z.object({
    assessmentId: z.string(),
    criterionName: z.string(),
    metadata: z.record(z.unknown()).optional(),
    scoreBreakdown: z.object({
      tag: z.string(),
      rawScore: z.number().int().min(0).max(100),
      summary: z.string().optional(),
      feedbackItems: z.array(
        z.object({
          comment: z.string(),
          fileRef: z.string(),
          tag: z.string(),
          locationData: z.record(z.unknown()),
        }),
      ),
    }),
  }),
};

export const criterionGradingFailedEvent = {
  name: "grading.criterion.failed",
  schema: z.object({
    assessmentId: z.string(),
    criterionName: z.string(),
    error: z.string(),
  }),
};
