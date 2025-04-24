import { defineEvent } from "@/utils/events";
import { z } from "zod";
import { GradingResultSchema } from "./shared-schema";

export const PluginGradingCompleted = defineEvent("plugin.grading.completed", {
  taskId: z.string(),
  criterionId: z.string(),
  pluginId: z.string(),
  results: GradingResultSchema,
  timestamp: z.string().datetime(),
});

export const PluginGradingFailed = defineEvent("plugin.grading.failed", {
  taskId: z.string(),
  criterionId: z.string(),
  pluginId: z.string(),
  error: z.string(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

export const PluginGradingStatusUpdated = defineEvent(
  "plugin.grading.status.updated",
  {
    taskId: z.string(),
    criterionId: z.string(),
    pluginId: z.string(),
    status: z.string(),
    description: z.string().optional(),
    timestamp: z.string().datetime(),
  }
);
