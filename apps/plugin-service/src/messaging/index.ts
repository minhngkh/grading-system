import logger from "@grading-system/utils/logger";
import { okAsync, ResultAsync, safeTry } from "neverthrow";
import { getTransporter } from "@/lib/transporter";
import {
  criterionGradingFailedEvent,
  criterionGradingSuccessEvent,
  submissionStartedEvent,
} from "@/messaging/events";
import { gradeSubmission as gradeSubmissionWithAI } from "@/plugins/ai/grade";
import { gradeSubmission as gradeSubmissionWithTestRunner } from "@/plugins/test-runner/grade";

export async function initMessaging() {
  // All of the function above can throw and make the system exit as it should
  const transporter = await getTransporter();

  transporter.consume(submissionStartedEvent, (data) =>
    safeTry(async function* () {
      // Split criteria by plugin type
      const aiCriteria = data.criteria.filter(c => c.plugin !== "test-runner");
      const testRunnerCriteria = data.criteria.filter(c => c.plugin === "test-runner");

      // Process both plugin types concurrently
      const [aiResults, testRunnerResults] = await Promise.all([
        // Handle AI plugin criteria
        aiCriteria.length > 0 
          ? gradeSubmissionWithAI({
              attemptId: data.assessmentId,
              criterionDataList: aiCriteria,
              attachments: data.attachments,
              metadata: data.metadata,
            })
          : null,

        // Handle test-runner plugin criteria  
        testRunnerCriteria.length > 0
          ? Promise.all(
              testRunnerCriteria.map(criterion => 
                gradeSubmissionWithTestRunner({
                  attemptId: data.assessmentId,
                  criterionData: criterion,
                  attachments: data.attachments,
                })
              )
            )
          : []
      ]);

      // Handle AI plugin results
      if (aiResults !== null) {
        if (aiResults.isErr()) {
          logger.info("Error grading AI submission", aiResults.error);

          for (const criterion of aiCriteria) {
            transporter.emit(criterionGradingFailedEvent, {
              assessmentId: data.assessmentId,
              criterionName: criterion.criterionName,
              error: aiResults.error.message,
            });
          }
        } else {
          const gradeResults = yield* ResultAsync.fromSafePromise(
            Promise.all(aiResults.value),
          );

          gradeResults.forEach((result: any) => {
            if (result.isErr()) {
              logger.info("Error when grading AI criterion", result.error);
              
              result.error.data.criterionNames.forEach((c: string) =>
                transporter.emit(criterionGradingFailedEvent, {
                  assessmentId: data.assessmentId,
                  criterionName: c,
                  error: result.error.message,
                }),
              );
            } else {
              result.value.forEach((value: any) => {
                transporter.emit(criterionGradingSuccessEvent, {
                  assessmentId: data.assessmentId,
                  criterionName: value.criterion,
                  metadata: {
                    ignoredFiles: value.ignoredFiles,
                  },
                  scoreBreakdown: {
                    tag: value.tag,
                    rawScore: value.score,
                    summary: value.summary,
                    feedbackItems: value.feedback.map((item: any) => ({
                      comment: item.comment,
                      fileRef: item.fileRef,
                      tag: "info",
                      locationData: item.locationData,
                    })),
                  },
                });
              });
            }
          });
        }
      }

      // Handle test-runner plugin results
      for (let i = 0; i < testRunnerResults.length; i++) {
        const result = testRunnerResults[i];
        const criterion = testRunnerCriteria[i];

        if (result.isErr()) {
          logger.info("Error grading test-runner submission", result.error);
          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: data.assessmentId,
            criterionName: criterion.criterionName,
            error: result.error.message,
          });
        } else {
          // For now, we'll emit a basic success event for test-runner
          // The actual scoring logic will be implemented when you complete the test-runner plugin
          logger.info("Test-runner submission processed", {
            criterionName: criterion.criterionName,
            zipPath: result.value.zipFilePath,
          });
          
          transporter.emit(criterionGradingSuccessEvent, {
            assessmentId: data.assessmentId,
            criterionName: criterion.criterionName,
            metadata: {
              zipFilePath: result.value.zipFilePath,
              sourceId: result.value.sourceId,
            },
            scoreBreakdown: {
              tag: "test-runner-processed",
              rawScore: 0, // Placeholder - implement actual scoring logic
              summary: "Test runner package created successfully",
              feedbackItems: [],
            },
          });
        }
      }

      return okAsync();
    }),
  );
}
