import type { PluginOperations } from "@grading-system/plugin-shared/plugin/info";
import type { Context } from "moleculer";
import {
  criterionGradingFailedEvent,
  criterionGradingSuccessEvent,
} from "@grading-system/plugin-shared/events/index";
import { getTransporter } from "@grading-system/plugin-shared/lib/transporter";
import {
  createSubmissionSchemaWithConfig,
} from "@grading-system/plugin-shared/plugin/data";
import { defineTypedService2 } from "@grading-system/typed-moleculer/service";
import logger from "@grading-system/utils/logger";
import { ZodParams } from "moleculer-zod-validator";
import { typeCoverageConfigSchema } from "./config";
import { gradeSubmission } from "./core";

const submissionSchema = createSubmissionSchemaWithConfig(typeCoverageConfigSchema);

export const gradeSubmissionActionParams = new ZodParams(submissionSchema.shape);

export const typeCoverageService = defineTypedService2({
  name: "type-coverage",
  version: 1,
  actions: {
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
              logger.info(
                `internal: Grading failed for ${error.data.criterionName}`,
                error,
              );

              transporter.emit(criterionGradingFailedEvent, {
                assessmentId: params.assessmentId,
                criterionName: error.data.criterionName,
                error: error.message,
              });
            })
            .andTee((value) => {
              transporter.emit(criterionGradingSuccessEvent, {
                assessmentId: params.assessmentId,
                criterionName: value.criterion,
                scoreBreakdown: {
                  tag: "",
                  rawScore: value.result.score,
                  summary: value.result.message,
                },
              });
            }),
        );

        await Promise.all(promises);
      },
    },
  },
});

export type TypeCoverageService = typeof typeCoverageService;

export const typeCoveragePluginOperations = {
  grade: {
    action: "v1.type-coverage.gradeSubmission",
  },
} satisfies PluginOperations<TypeCoverageService>;
