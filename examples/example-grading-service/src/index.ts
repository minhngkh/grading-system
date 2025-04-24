// Load environment variables first, before any other imports
import 'dotenv/config';

import { ServiceBroker } from "moleculer";
import brokerConfig from "./moleculer.config";
import AIWrapperService from "./services/ai-wrapper.service";
import graderService from "./services/grader.service";

// Create service broker
const broker = new ServiceBroker(brokerConfig);

// Load services
broker.createService(graderService);
broker.createService(AIWrapperService);

// Start broker and handle errors
broker.start()
  .then(() => {
    broker.logger.info("Grader service started successfully");
    broker.logger.info(`AI wrapper service is available at http://localhost:${process.env.API_PORT || 3000}/api`);
  })
  .catch((err) => {
    broker.logger.error("Error starting services:", err);
    process.exit(1);
  });

// Handle process termination
process.on("SIGINT", async () => {
  await broker.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await broker.stop();
  process.exit(0);
});
