import type { Context } from "moleculer";
import type { Feedback } from "@/plugins/data";
import type { PluginOperations } from "@/plugins/info";
import { defineTypedService2 } from "@grading-system/typed-moleculer/service";
import logger from "@grading-system/utils/logger";
import { getTransporter } from "@/lib/transporter";
import {
  criterionGradingFailedEvent,
  criterionGradingSuccessEvent,
} from "@/messaging/events";
import { gradeSubmissionActionParams } from "@/plugins/data";
import { gradeSubmission } from "@/plugins/type-coverage/core";

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
                  rawScore: value.score,
                  summary: value.message,
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
