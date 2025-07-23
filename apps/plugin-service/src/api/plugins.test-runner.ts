import type { ServiceBroker } from "moleculer";
import type { GoJudge } from "@/plugins/test-runner/go-judge-api";
import type { TestRunnerService } from "@/plugins/test-runner/service";
import { actionCaller } from "@grading-system/typed-moleculer/action";
import logger from "@grading-system/utils/logger";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { testRunnerCallbackUrlSchema } from "@/plugins/test-runner/core";

export function route(broker: ServiceBroker) {
  return new Hono().post(
    "/callback",
    describeRoute({
      tags: ["Callback", "Plugins"],
      description: "Callback endpoint for test runner plugin",
      responses: {
        200: {
          description: "Successful response (either stream or json)",
        },
        400: {
          description: "Validation error",
        },
      },
    }),
    validator("query", testRunnerCallbackUrlSchema),
    async (c) => {
      const query = c.req.valid("query");

      switch (query.type) {
        case "upload":
          logger.info("Received upload callback", query);

          await actionCaller<TestRunnerService>()(
            broker,
            "v1.test-runner.initializeSubmission",
            { id: query.id },
          );
          break;

        case "init":
          logger.info("Received init callback", query);
          await actionCaller<TestRunnerService>()(
            broker,
            "v1.test-runner.runSubmission",
            { id: query.id },
          );
          break;

        case "run":
          {
            logger.info("Received run callback", query);

            // TODO: validate the body
            const body = await c.req.json<GoJudge.RunResult>();

            await actionCaller<TestRunnerService>()(
              broker,
              "v1.test-runner.aggregateResults",
              { query, body },
            );
          }
          break;

        default:
          logger.warn("Unknown callback type", query.type);
          return c.json({ error: "Unknown callback type" }, 400);
      }

      return c.json(null, 200);
    },
  );
}
