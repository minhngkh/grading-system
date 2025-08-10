import type { PluginOperations } from "@grading-system/plugin-shared/plugin/info";
import type { Context } from "moleculer";
import { getTransporter } from "@grading-system/plugin-shared/lib/transporter";
import { createSubmissionSchemaWithConfig } from "@grading-system/plugin-shared/plugin/data";
import { defineTypedService2 } from "@grading-system/typed-moleculer/service";
import logger from "@grading-system/utils/logger";
import { coreMessageSchema } from "ai";
import { ZodParams } from "moleculer-zod-validator";
import z from "zod";
import {
  criterionGradingFailedEvent,
  criterionGradingSuccessEvent,
} from "@/messaging/events";
import { aiConfigSchema } from "@/plugins/ai/config";
import { gradeSubmission } from "@/plugins/ai/grade";
import { generateChatResponse, rubricSchema } from "./core";

export const chatRubricActionSchema = z.object({
  messages: z.array(coreMessageSchema).describe("Chat messages"),
  weightInRange: z
    .boolean()
    .nullable()
    .optional()
    .default(null)
    .describe("Type of weight in each level"),
  rubric: rubricSchema.optional().describe("Current rubric"),
  stream: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to stream the response or not"),
});
export const chatRubricActionParams = new ZodParams(chatRubricActionSchema.shape);

const submissionSchema = createSubmissionSchemaWithConfig(aiConfigSchema);
export const gradeSubmissionActionParams = new ZodParams(submissionSchema.shape);

export const aiService = defineTypedService2({
  name: "ai",
  version: 1,
  actions: {
    chatRubric: {
      params: chatRubricActionParams.schema,
      async handler(ctx: Context<typeof chatRubricActionParams.context>) {
        const params = ctx.params;

        const result = await generateChatResponse({
          messages: params.messages,
          weightInRange: params.weightInRange,
          rubric: params.rubric,
          stream: params.stream,
        });

        if (result.isErr()) {
          throw new Error(result.error.message, { cause: result.error });
        }

        return result.value;
      },
    },

    gradeSubmission: {
      params: gradeSubmissionActionParams.schema,
      async handler(ctx: Context<typeof gradeSubmissionActionParams.context>) {
        const params = ctx.params;

        const result = await gradeSubmission({
          attemptId: params.assessmentId,
          criterionDataList: params.criterionDataList,
          attachments: params.attachments,
          metadata: params.metadata,
        });

        if (result.isErr()) {
          throw new Error(result.error.message);
        }

        const transporter = await getTransporter();

        const promises = result.value.map((value) =>
          value
            .orTee((error) => {
              logger.debug("Failed to grade criterion", error);

              for (const criterion of error.data.criterionNames) {
                transporter.emit(criterionGradingFailedEvent, {
                  assessmentId: params.assessmentId,
                  criterionName: criterion,
                  error: error.message,
                });
              }
            })
            .andTee((value) => {
              for (const item of value) {
                transporter.emit(criterionGradingSuccessEvent, {
                  assessmentId: params.assessmentId,
                  criterionName: item.criterion,
                  metadata: {
                    ignoredFiles: item.ignoredFiles,
                  },
                  scoreBreakdown: {
                    tag: item.tag,
                    rawScore: item.score,
                    summary: item.summary,
                    feedbackItems: item.feedback.map((feedbackItem) => ({
                      comment: feedbackItem.comment,
                      fileRef: feedbackItem.fileRef,
                      tag: "info",
                      locationData: feedbackItem.locationData,
                    })),
                  },
                });
              }
            }),
        );

        await Promise.all(promises);
      },
    },
  },
});

export type AIService = typeof aiService;

export const aiPluginOperations = {
  grade: {
    action: "v1.ai.gradeSubmission",
  },
} satisfies PluginOperations<AIService>;
