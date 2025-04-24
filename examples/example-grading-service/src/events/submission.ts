import { defineEvent } from "@/utils/events";
import { z } from "zod";

export const SubmissionGradingRequested = defineEvent(
  "submission.grading.requested",
  {
    taskId: z.string(),
    requestedAt: z.string().datetime(),
    rubricId: z.string(),
    fileReferences: z.array(z.string().url()),
  }
);

export const SubmissionCriterionGradingRequested = defineEvent(
  "submission.criterion.grading.requested",
  {
    taskId: z.string(),
    requestedAt: z.string().datetime(),
    criterionId: z.string(),
    fileReferences: z.array(z.string().url()),
  }
);