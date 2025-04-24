import { readFile as readFileFs } from "node:fs/promises";
import process from "node:process";
import { SubmissionGradingRequested } from "@/events/demo";
import {
  GradingCriterionsCompleted,
  GradingRubricFailed,
} from "@/events/grading";
import AIWrapperService from "@/services/ai-wrapper.service";

import { GradingService } from "@/services/demo-grader.service";
import { emitEvent } from "@/utils/events";
import { defineEventHandler } from "@/utils/typed-moleculer";
import { ServiceBroker } from "moleculer";
import "dotenv/config";

/**
 * Reads a file as UTF-8 string using Node.js fs/promises.
 */
const readFile = (path: string) => readFileFs(path, { encoding: "utf-8" });

/**
 * Main function to run the demo grading test.
 */
async function main() {
  const fileName = "token.go";
  const taskId = `demo-task-${Date.now()}`;
  const requestedAt = new Date().toISOString();

  const broker = new ServiceBroker({
    logger: true,
    logLevel: "info",
    nodeID: "demo-grader-test",
    validator: false,
  });

  // Listen for completed/failed events
  broker.createService({
    name: "demo-grader-test-listener",
    events: {
      [GradingCriterionsCompleted.name]: defineEventHandler(
        GradingCriterionsCompleted,
        /**
         * Handles grading result: logs the result and exits.
         */
        async (ctx) => {
          console.log("\n✅ Grading completed:", ctx.params);
          // setTimeout(() => process.exit(0), 500);
        }
      ),
      [GradingRubricFailed.name]: defineEventHandler(
        GradingRubricFailed,
        async (ctx) => {
          console.error("\n❌ Grading failed:", ctx.params);
          // setTimeout(() => process.exit(1), 500);
        }
      ),
    },
  });
  broker.createService(AIWrapperService);
  broker.createService(GradingService);

  await broker.start();
  
  // // Emit the grading request event
  // const rubricPrompt = await readFile("examples/rubric.md");
  // const fileText = await readFile("examples/token.go");
  // emitEvent(broker, SubmissionGradingRequested, {
  //   taskId,
  //   requestedAt,
  //   rubricPrompt,
  //   fileText,
  //   fileName,
  // })
  // console.log("\n🚀 Submitted grading request. Waiting for result...");

  process.on("SIGINT", async () => {
    await broker.stop();
    process.exit(0);
  });
  
  process.on("SIGTERM", async () => {
    await broker.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
