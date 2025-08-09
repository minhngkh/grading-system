import "dotenv/config";

import process from "node:process";
import { createZodValidatedServiceBroker } from "@grading-system/typed-moleculer/service";
import logger from "@grading-system/utils/logger";
import { staticAnalysisService } from "./service";

const broker = createZodValidatedServiceBroker();
broker.createService(staticAnalysisService);

async function start() {
  try {
    // Start Moleculer broker
    await broker.start();
    logger.info("Moleculer broker started");

    logger.info("Server started");

    process.on("SIGINT", async () => {
      logger.info("Gracefully shutting down...");
      await broker.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("Gracefully shutting down...");
      await broker.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
