import { defineEvent } from "@/utils/events";
import { z } from "zod";
import { GradingResultSchema } from "./shared-schema";

export const GradingCriterionsStarted = defineEvent(
  "grading.criterions.started",
  {
    taskId: z.string(),
    criterionIds: z.array(z.string()),
    timestamp: z.string().datetime(),
  }
);

export const GradingCriterionsStatusUpdated = defineEvent(
  "grading.criterions.status.updated",
  {
    taskId: z.string(),
    criterionIds: z.array(z.string()),
    status: z.string(),
    description: z.string().optional(),
    timestamp: z.string().datetime(),
  }
);

export const GradingPluginRequested = defineEvent("grading.plugin.requested", {
  taskId: z.string(),
  criterionId: z.string(),
  pluginId: z.string(),
  fileReferences: z.array(z.string().url()),
  configId: z.string(),
  timestamp: z.string().datetime(),
});

export const GradingCriterionsCompleted = defineEvent(
  "grading.criterions.completed",
  {
    taskId: z.string(),
    results: z.array(GradingResultSchema),
    timestamp: z.string().datetime(),
  }
);

export const GradingCriterionsFailed = defineEvent(
  "grading.criterions.failed",
  {
    taskId: z.string(),
    criterionIds: z.array(z.string()),
    error: z.string(),
    message: z.string().optional(),
    timestamp: z.string().datetime(),
  }
);

export const GradingRubricFailed = defineEvent("grading.rubric.failed", {
  taskId: z.string(),
  error: z.string(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});
