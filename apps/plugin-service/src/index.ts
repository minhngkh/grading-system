// import "dotenv/config";

import process from "node:process";
import { apiGateway } from "./api";
import { aiService } from "./plugins/ai/service";
import logger from "./utils/logger";
import { createZodValidatedServiceBroker } from "./utils/typed-moleculer";

const broker = createZodValidatedServiceBroker({
  // errorHandler(error, info) {
  //   this.logger.warn("Error handled:", error.message);
  // },
});
broker.createService(aiService);
broker.createService(apiGateway);

broker
  .start()
  .then(() => {
    process.on("SIGINT", async () => {
      await broker.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await broker.stop();
      process.exit(0);
    });
  })
  // .catch((err) => {
  //   logger.error("Error starting broker:", err);
  //   process.exit(1);
  // });
