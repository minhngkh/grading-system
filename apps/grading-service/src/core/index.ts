import logger from "@grading-system/utils/logger";
import { submissionGradedEvent, submissionStartedEvent } from "@/events";
import { createEventConsumer, createEventEmitter } from "@/lib/rabbitmq-masstransit";

export async function setup() {
  const emitter = await createEventEmitter(submissionGradedEvent);
  (await createEventConsumer(submissionStartedEvent)).consume(async (data) => {
    logger.debug("Received submission started event:", data);
    emitter.emit({
      assessmentId: "12345",
      scoreBreakdown: [],
      errors: ["cannot grade submission"],
    });
  });
}
