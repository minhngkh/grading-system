import "dotenv/config";

import process from "node:process";
import { createMoleculerBroker } from "@grading-system/plugin-shared/lib/transporter";
import logger from "@grading-system/utils/logger";
import { serve } from "@hono/node-server";
import { initMessaging } from "@/messaging";
import { createApiGateway } from "./api";
import { syncDB } from "./db/init";
import { connectMongoDB } from "./db/mongoose";
import { aiService } from "./plugins/ai/service";

const broker = createMoleculerBroker({
  internal: {
    requestTimeout: 3 * 60 * 1000, // 3 minutes for long-running AI requests
    // retryPolicy: {
    //   enabled: false, // Disable retries to avoid duplicate grading
    // },
    circuitBreaker: {
      enabled: true,
    }
  },
});
broker.createService(aiService);
// broker.createService(staticAnalysisService);
// broker.createService(testRunnerService);
// broker.createService(typeCoverageService);

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
    await initMessaging(broker);

    // Start Moleculer broker
    await broker.start();
    logger.info("Moleculer broker started");

    const server = serve({
      fetch: api.fetch,
      port: Number.parseInt(process.env.PORT ?? "5069", 10),
    });

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
