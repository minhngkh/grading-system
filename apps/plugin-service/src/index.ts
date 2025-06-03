import "dotenv/config";

import process from "node:process";
import { createZodValidatedServiceBroker } from "@grading-system/typed-moleculer/service";
import logger from "@grading-system/utils/logger";
import { serve } from "@hono/node-server";
import { init } from "@/internal";
import { createApiGateway } from "./api";
import { syncDB } from "./db/init";
import { connectMongoDB } from "./db/mongoose";
import { aiService } from "./plugins/ai/service";


const broker = createZodValidatedServiceBroker();
broker.createService(aiService);

const api = createApiGateway(broker);

async function start() {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    logger.info("Connected to MongoDB");

    // Initialize default plugins if needed
    await syncDB();
    logger.info("Plugin initialization completed");

    // Set up event listeners for interacting with external systems
    await init();

    // Start Moleculer broker
    await broker.start();
    logger.info("Moleculer broker started");

    const server = serve({
      fetch: api.fetch,
      port: Number.parseInt(process.env.PORT ?? "5069", 10),
    });

    // const output = await packFiles();
    // const content = await fs.readFile(output, "utf-8");
    // const result = await actionCaller<AIService>()(broker, "v1.ai.grade", {
    //   prompt: content,
    //   rubric: {
    //     rubricName: "Report Evaluation Rubric",
    //     weightInRange: "false",
    //     tags: ["0", "1", "2", "3"],
    //     criteria: [
    //       {
    //         name: "Content",
    //         weight: 40,
    //         levels: [
    //           {
    //             tag: "3",
    //             weight: 100,
    //             description:
    //               "All required content is present, accurate, and thoroughly addresses the topic.",
    //           },
    //           {
    //             tag: "2",
    //             weight: 75,
    //             description:
    //               "Most required content is present and accurate, addressing the topic well.",
    //           },
    //           {
    //             tag: "1",
    //             weight: 50,
    //             description:
    //               "Some required content is missing or inaccurate, and the topic is not fully addressed.",
    //           },
    //           {
    //             tag: "0",
    //             weight: 0,
    //             description:
    //               "Significant content is missing or inaccurate, and the topic is barely addressed.",
    //           },
    //         ],
    //       },
    //       {
    //         name: "Organization",
    //         weight: 25,
    //         levels: [
    //           {
    //             tag: "3",
    //             weight: 100,
    //             description:
    //               "The report is logically structured with clear headings and transitions, making it easy to follow.",
    //           },
    //           {
    //             tag: "2",
    //             weight: 75,
    //             description:
    //               "The report is generally well-structured, but some transitions may be unclear.",
    //           },
    //           {
    //             tag: "1",
    //             weight: 50,
    //             description:
    //               "The organization is somewhat confusing, with inconsistent headings or transitions.",
    //           },
    //           {
    //             tag: "0",
    //             weight: 0,
    //             description:
    //               "The report lacks clear organization, making it difficult to understand.",
    //           },
    //         ],
    //       },
    //       {
    //         name: "Clarity",
    //         weight: 20,
    //         levels: [
    //           {
    //             tag: "3",
    //             weight: 100,
    //             description:
    //               "The language is precise, concise, and easy to understand, with no ambiguity.",
    //           },
    //           {
    //             tag: "2",
    //             weight: 75,
    //             description:
    //               "The language is mostly clear, but there may be minor instances of ambiguity.",
    //           },
    //           {
    //             tag: "1",
    //             weight: 50,
    //             description:
    //               "The language is often unclear or ambiguous, hindering comprehension.",
    //           },
    //           {
    //             tag: "0",
    //             weight: 0,
    //             description:
    //               "The language is consistently unclear, making the report very difficult to understand.",
    //           },
    //         ],
    //       },
    //       {
    //         name: "Grammar and Mechanics",
    //         weight: 15,
    //         levels: [
    //           {
    //             tag: "3",
    //             weight: 100,
    //             description:
    //               "The report is free of grammatical errors, spelling mistakes, and punctuation errors.",
    //           },
    //           {
    //             tag: "2",
    //             weight: 75,
    //             description:
    //               "The report has a few minor grammatical or spelling errors that do not significantly impact readability.",
    //           },
    //           {
    //             tag: "1",
    //             weight: 50,
    //             description:
    //               "The report has several grammatical or spelling errors that occasionally hinder readability.",
    //           },
    //           {
    //             tag: "0",
    //             weight: 0,
    //             description:
    //               "The report is riddled with grammatical and spelling errors, making it unprofessional and hard to read.",
    //           },
    //         ],
    //       },
    //     ],
    //   },
    // });
    // if (result.isErr()) {
    //   logger.error("AI grading action failed", result.error);
    //   throw new Error("AI grading action failed");
    // }


    // logger.info("AI grading action executed successfully", result.value);

    logger.info("Server started");

    process.on("SIGINT", async () => {
      logger.info("Gracefully shutting down...");
      await Promise.all([server.close(), broker.stop()]);
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("Gracefully shutting down...");
      let exitCode = 0;
      await Promise.all([
        server.close((err) => {
          if (err) {
            logger.error("Error closing server:", err);
            exitCode = 1;
          }
        }),
        broker.stop(),
      ]);
      process.exit(exitCode);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
