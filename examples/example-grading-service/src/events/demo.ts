import { defineEvent } from "@/utils/events";
import { z } from "zod";

export const SubmissionGradingRequested = defineEvent(
  "demo.grading.requested",
  {
    taskId: z.string(),
    requestedAt: z.string().datetime(),
    rubricPrompt: z.string(),
    fileText: z.string(),
    fileName: z.string(),
  }
);

export const DemoGradingResultSchema = z.object({
  criterion: z.string(),
  score: z.number(),
  feedback: z.string(),
  fileReference: z.string(),
  position: z
    .object({
      fromLine: z.number(),
      fromColumn: z.number().optional(),
      toLine: z.number(),
      toColumn: z.number().optional(),
    })
    .optional(),
});

export const DemoGradingResultsObjSchema = z.object({
  results: z.array(DemoGradingResultSchema),
});