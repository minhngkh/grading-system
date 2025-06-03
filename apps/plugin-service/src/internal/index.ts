import type z from "zod";
import logger from "@grading-system/utils/logger";
import { createEventConsumer, createEventEmitter } from "@/lib/rabbitmq-masstransit";
import { gradeSubmission } from "@/plugins/ai/grade";
import { submissionGradedEvent, submissionStartedEvent } from "./events";

export async function init() {
  const submissionStartedConsumer = await createEventConsumer(submissionStartedEvent);
  const submissionGradedEmitter = await createEventEmitter(submissionGradedEvent);

  submissionStartedConsumer.consume(async (data) => {
    logger.debug("Received submission started event:", data);

    // await downloadFiles(data.criteria.flatMap((c) => c.fileRefs));

    const result = await gradeSubmission(
      data.criteria.map((c) => ({
        criterion: c.criterionName,
        configuration: c.configuration,
        fileRefs: c.fileRefs,
        levels: c.levels,
        plugin: c.plugin,
      })),
    );

    if (result.isErr()) {
      logger.error("Failed to grade submission:", result.error);

      const response = data.criteria.map(
        (c) => `${result.error.message}: ${c.criterionName}`,
      );

      submissionGradedEmitter.emit({
        assessmentId: data.assessmentId,
        errors: response,
      });
      return;
    }

    const breakdown: z.infer<typeof submissionGradedEvent.schema>["scoreBreakdown"] = [];
    const errors: z.infer<typeof submissionGradedEvent.schema>["errors"] = [];

    result.value.forEach((item) => {
      if ("error" in item) {
        errors.push(...item.error.map((e) => `${e}: ${item.criterion}`));
        return;
      }

      breakdown.push({
        criterionName: item.criterion,
        tag: item.tag,
        rawScore: item.score,
        summary: item.summary,
        feedbackItems: item.feedback.map((f) => ({
          comment: f.comment,
          fileRef: f.fileRef,
          tag: item.tag,
          fromCol: f.position.fromColumn,
          toCol: f.position.toColumn,
          fromLine: f.position.fromLine,
          toLine: f.position.toLine,
        })),
      });
    });

    submissionGradedEmitter.emit({
      assessmentId: data.assessmentId,
      scoreBreakdown: breakdown,
      errors: errors.length > 0 ? errors : undefined,
    });
  });
}
