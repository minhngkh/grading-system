import type { Context } from "moleculer";
import type { Feedback } from "@/plugins/data";
import type { PluginOperations } from "@/plugins/info";
import { defineTypedService2 } from "@grading-system/typed-moleculer/service";
import { getTransporter } from "@/lib/transporter";
import {
  criterionGradingFailedEvent,
  criterionGradingSuccessEvent,
} from "@/messaging/events";
import { gradeSubmissionActionParams } from "@/plugins/data";
import { gradeSubmission } from "@/plugins/static-analysis/core";

export const staticAnalysisService = defineTypedService2({
  name: "static-analysis",
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
                metadata: {
                  ignoredFiles: value.ignoredFiles,
                  feedbackItems: value.feedback.map((feedbackItem) => ({
                    comment: feedbackItem.message || "",
                    fileRef: feedbackItem.fileRef,
                    tag: feedbackItem.severity,
                    locationData: {
                      type: "text",
                      fromLine: feedbackItem.position.fromLine,
                      fromColumn: feedbackItem.position.fromCol,
                      toLine: feedbackItem.position.toLine,
                      toColumn: feedbackItem.position.toCol,
                    },
                  })) satisfies Feedback[],
                },
                scoreBreakdown: {
                  tag: "0",
                  rawScore: value.score,
                  feedbackItems: [],
                  // feedbackItems: value.feedback.map((feedbackItem) => ({
                  //   comment: feedbackItem.message || "",
                  //   fileRef: feedbackItem.fileRef,
                  //   tag: feedbackItem.severity,
                  //   locationData: {
                  //     type: "text",
                  //     fromLine: feedbackItem.position.fromLine,
                  //     fromColumn: feedbackItem.position.fromCol,
                  //     toLine: feedbackItem.position.toLine,
                  //     toColumn: feedbackItem.position.toCol,
                  //   },
                  // })) satisfies Feedback[],
                },
              });
            }),
        );

        await Promise.all(promises);
      },
    },
  },
});

export type StaticAnalysisService = typeof staticAnalysisService;

export const staticAnalysisPluginOperations = {
  grade: {
    action: "v1.static-analysis.gradeSubmission",
  },
} satisfies PluginOperations<StaticAnalysisService>;

// import type { Context } from 'moleculer';
// import type { AnalysisRequest } from './types';
// import { defineTypedService2 } from '@grading-system/typed-moleculer/service';
// import { ZodParams } from 'moleculer-zod-validator';
// import { z } from 'zod';
// import { analyzeFiles } from './core';
// import { analyzeZipBuffer } from './grade-zip';

// const fileSchema = z.object({
//   filename: z.string().min(1),
//   content: z.string().min(1),
// });

// const analyzeParams = new ZodParams({
//   files: z.array(fileSchema).min(1),
//   rules: z.string().optional(),
// });

// const analyzeZipParams = new ZodParams({
//   zip: z.instanceof(Buffer),
// });

// export const staticAnalysisService = defineTypedService2({
//   name: 'static_analysis',
//   version: 1,
//   actions: {
//     analyze: {
//       params: analyzeParams.schema,
//       async handler(ctx: Context<typeof analyzeParams.context>) {
//         const req: AnalysisRequest = {
//           files: ctx.params.files,
//           rules: ctx.params.rules,
//         };
//         return analyzeFiles(req);
//       },
//     },
//     analyzeZip: {
//       params: analyzeZipParams.schema,
//       async handler(ctx: Context<typeof analyzeZipParams.context>) {
//         return analyzeZipBuffer(ctx.params.zip);
//       },
//     },
//     test: {
//       handler() {
//         return 'static_analysis service is running';
//       },
//     },
//   },
// });

// export type StaticAnalysisService = typeof staticAnalysisService;
