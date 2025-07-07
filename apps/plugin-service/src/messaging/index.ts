import type { ServiceActionPath } from "@grading-system/typed-moleculer/action";
import type { ServiceBroker } from "moleculer";
import type { AIService } from "@/plugins/ai/service";
import { actionCaller } from "@grading-system/typed-moleculer/action";
import { asError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { fromPromise, fromSafePromise, okAsync, safeTry } from "neverthrow";
import { getTransporter } from "@/lib/transporter";
import { criterionGradingFailedEvent, submissionStartedEvent } from "@/messaging/events";
import { plugins } from "@/plugins/info";

export async function initMessaging(broker: ServiceBroker) {
  // All of the function above can throw and make the system exit as it should
  const transporter = await getTransporter();

  // transporter.consume(submissionStartedEvent, (data) =>
  //   safeTry(async function* () {
  //     // Split criteria by plugin type
  //     const aiCriteria = data.criteria.filter(c => c.plugin !== "test-runner");
  //     const testRunnerCriteria = data.criteria.filter(c => c.plugin === "test-runner");

  //     // Process both plugin types concurrently
  //     const [aiResults, testRunnerResults] = await Promise.all([
  //       // Handle AI plugin criteria
  //       aiCriteria.length > 0
  //         ? gradeSubmissionWithAI({
  //             attemptId: data.assessmentId,
  //             criterionDataList: aiCriteria,
  //             attachments: data.attachments,
  //             metadata: data.metadata,
  //           })
  //         : null,

  //       // Handle test-runner plugin criteria
  //       testRunnerCriteria.length > 0
  //         ? Promise.all(
  //             testRunnerCriteria.map(criterion =>
  //               gradeSubmissionWithTestRunner({
  //                 attemptId: data.assessmentId,
  //                 criterionData: criterion,
  //                 attachments: data.attachments,
  //               })
  //             )
  //           )
  //         : []
  //     ]);

  //     // Handle AI plugin results
  //     if (aiResults !== null) {
  //       if (aiResults.isErr()) {
  //         logger.info("Error grading AI submission", aiResults.error);

  //         for (const criterion of aiCriteria) {
  //           transporter.emit(criterionGradingFailedEvent, {
  //             assessmentId: data.assessmentId,
  //             criterionName: criterion.criterionName,
  //             error: aiResults.error.message,
  //           });
  //         }
  //       } else {
  //         const gradeResults = yield* ResultAsync.fromSafePromise(
  //           Promise.all(aiResults.value),
  //         );

  //         gradeResults.forEach((result: any) => {
  //           if (result.isErr()) {
  //             logger.info("Error when grading AI criterion", result.error);

  //             result.error.data.criterionNames.forEach((c: string) =>
  //               transporter.emit(criterionGradingFailedEvent, {
  //                 assessmentId: data.assessmentId,
  //                 criterionName: c,
  //                 error: result.error.message,
  //               }),
  //             );
  //           } else {
  //             result.value.forEach((value: any) => {
  //               transporter.emit(criterionGradingSuccessEvent, {
  //                 assessmentId: data.assessmentId,
  //                 criterionName: value.criterion,
  //                 metadata: {
  //                   ignoredFiles: value.ignoredFiles,
  //                 },
  //                 scoreBreakdown: {
  //                   tag: value.tag,
  //                   rawScore: value.score,
  //                   summary: value.summary,
  //                   feedbackItems: value.feedback.map((item: any) => ({
  //                     comment: item.comment,
  //                     fileRef: item.fileRef,
  //                     tag: "info",
  //                     locationData: item.locationData,
  //                   })),
  //                 },
  //               });
  //             });
  //           }
  //         });
  //       }
  //     }

  //     // Handle test-runner plugin results
  //     for (let i = 0; i < testRunnerResults.length; i++) {
  //       const result = testRunnerResults[i];
  //       const criterion = testRunnerCriteria[i];

  //       if (result.isErr()) {
  //         logger.info("Error grading test-runner submission", result.error);
  //         transporter.emit(criterionGradingFailedEvent, {
  //           assessmentId: data.assessmentId,
  //           criterionName: criterion.criterionName,
  //           error: result.error.message,
  //         });
  //       } else {
  //         // For now, we'll emit a basic success event for test-runner
  //         // The actual scoring logic will be implemented when you complete the test-runner plugin
  //         logger.info("Test-runner submission processed", {
  //           criterionName: criterion.criterionName,
  //           zipPath: result.value.zipFilePath,
  //         });

  //         transporter.emit(criterionGradingSuccessEvent, {
  //           assessmentId: data.assessmentId,
  //           criterionName: criterion.criterionName,
  //           metadata: {
  //             zipFilePath: result.value.zipFilePath,
  //             sourceId: result.value.sourceId,
  //           },
  //           scoreBreakdown: {
  //             tag: "test-runner-processed",
  //             rawScore: 0, // Placeholder - implement actual scoring logic
  //             summary: "Test runner package created successfully",
  //             feedbackItems: [],
  //           },
  //         });
  //       }
  //     }

  //     return okAsync();
  //   }),
  // );

  transporter.consume(submissionStartedEvent, (data) =>
    safeTry(async function* () {
      const tasks = {
        ai: {
          "~type": undefined as unknown as AIService,
          actionName: "v1.ai.gradeSubmission" as ServiceActionPath<AIService>,
          criteria: [] as typeof data.criteria,
        },
        testRunner: {
          "~type": undefined as unknown as AIService,
          actionName: "v1.ai.gradeSubmission" as ServiceActionPath<AIService>,
          criteria: [] as typeof data.criteria,
        },
      };

      for (const criterion of data.criteria) {
        switch (criterion.plugin) {
          case plugins.ai.id:
            tasks.ai.criteria.push(criterion);
            break;
          case plugins.testRunner.id:
            tasks.testRunner.criteria.push(criterion);
            break;
          default:
            transporter.emit(criterionGradingFailedEvent, {
              assessmentId: data.assessmentId,
              criterionName: criterion.criterionName,
              error: `Unsupported plugin: ${criterion.plugin}`,
            });
            // tasks.ai.criteria.push(criterion);
        }
      }

      const promises = [];

      for (const [_, task] of Object.entries(tasks)) {
        if (task.criteria.length === 0) {
          continue;
        }

        promises.push(
          fromPromise(
            actionCaller<(typeof task)["~type"]>()(broker, task.actionName, {
              assessmentId: data.assessmentId,
              criterionDataList: task.criteria,
              attachments: data.attachments,
              metadata: data.metadata,
            }).then(() => undefined),
            (error) => {
              // Emit failure events for each criterion in the task if there is error
              // calling the grading action
              for (const criterion of task.criteria) {
                transporter.emit(criterionGradingFailedEvent, {
                  assessmentId: data.assessmentId,
                  criterionName: criterion.criterionName,
                  error: asError(error).message,
                });
              }
            },
          ),
        );
      }

      yield* fromSafePromise(Promise.all(promises));
      return okAsync();
    }),
  );
}
