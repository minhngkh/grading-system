import type { ServiceEvent } from "@/types/event";
import z from "zod";

export const submissionStartedEvent = {
  name: "grading.submission.started",
  schema: z.object({
    assessmentId: z.string(),
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
    scoreBreakdown: z
      .array(
        z.object({
          criterionName: z.string(),
          tag: z.string(),
          rawScore: z.number().int().min(0).max(100),
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
      )
      .optional(),
    errors: z.array(z.string()).optional(),
  }),
} satisfies ServiceEvent;
