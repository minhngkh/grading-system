import logger from "@grading-system/utils/logger";
import { errAsync, okAsync, ResultAsync, safeTry } from "neverthrow";
import { getTransporter } from "@/lib/transporter";
import {
  criterionGradingFailedEvent,
  criterionGradingSuccessEvent,
  submissionStartedEvent,
} from "@/messaging/events";
import { gradeSubmission } from "@/plugins/ai/grade";

export async function initMessaging() {
  // All of the function above can throw and make the system exit as it should
  const transporter = await getTransporter();

  transporter.consume(submissionStartedEvent, (data) =>
    safeTry(async function* () {
      const resultList = await gradeSubmission({
        attemptId: data.assessmentId,
        criterionDataList: data.criteria,
        attachments: data.attachments,
        metadata: data.metadata,
      });
      if (resultList.isErr()) {
        logger.info("Error grading submission", resultList.error);

        for (const criterion of data.criteria) {
          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: data.assessmentId,
            criterionName: criterion.criterionName,
            error: resultList.error.message,
          });
        }
        return errAsync();
      }

      const gradeResults = yield* ResultAsync.fromSafePromise(
        Promise.all(resultList.value),
      );

      gradeResults.forEach((result) => {
        if (result.isErr()) {
          logger.info("Error when grading criterion", result.error);
          
          result.error.data.criterionNames.forEach((c) =>
            transporter.emit(criterionGradingFailedEvent, {
              assessmentId: data.assessmentId,
              criterionName: c,
              error: result.error.message,
            }),
          );
        } else {
          result.value.forEach((value) => {
            transporter.emit(criterionGradingSuccessEvent, {
              assessmentId: data.assessmentId,
              criterionName: value.criterion,
              // plugin: "ai",
              metadata: {
                ignoredFiles: value.ignoredFiles,
              },
              scoreBreakdown: {
                tag: value.tag,
                rawScore: value.score,
                summary: value.summary,
                feedbackItems: value.feedback.map((item) => ({
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

      return okAsync();
    }),
  );
}
