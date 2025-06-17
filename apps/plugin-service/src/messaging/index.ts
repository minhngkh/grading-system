import type z from "zod";
import { okAsync, safeTry } from "neverthrow";
import { getTransporter } from "@/lib/transporter";
import { submissionGradedEvent, submissionStartedEvent } from "@/messaging/events";
import { gradeSubmission } from "@/plugins/ai/grade";

export async function initMessaging() {
  // All of the function above can throw and make the system exit as it should
  const transporter = await getTransporter();

  transporter.consume(submissionStartedEvent, (data) =>
    safeTry(async function* () {
      const resultList = yield* gradeSubmission(data.criteria);

      const gradeResults = await Promise.all(resultList);

      const message = gradeResults.reduce(
        (acc, result) => {
          if (result.isErr()) {
            result.error.data.criterionNames.forEach((c) =>
              acc.errors.push({
                criterionName: c,
                error: result.error.message,
              }),
            );
          } else {
            result.value.forEach((data) => {
              acc.scoreBreakdowns.push({
                criterionName: data.criterion,
                tag: data.tag,
                rawScore: data.score,
                plugin: "ai",
                metadata: undefined,
                summary: data.summary,
                feedbackItems: data.feedback.map((item) => ({
                  comment: item.comment,
                  fileRef: item.fileRef,
                  tag: "info",
                  fromCol: item.position.fromColumn,
                  toCol: item.position.toColumn,
                  fromLine: item.position.fromLine,
                  toLine: item.position.toLine,
                })),
              });
            });
          }

          return acc;
        },
        {
          assessmentId: data.assessmentId,
          scoreBreakdowns: [],
          errors: [],
        } as z.infer<typeof submissionGradedEvent.schema>,
      );

      transporter.emit(submissionGradedEvent, message);

      return okAsync();
    }),
  );
}
