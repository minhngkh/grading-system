import "zod-openapi/extend";

import type { DescribeRouteOptions } from "hono-openapi";
import type { ServiceBroker } from "moleculer";
import process from "node:process";
import logger from "@grading-system/utils/logger";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { Errors } from "moleculer";
import z from "zod";
import { route as aiRoute } from "@/api/plugins.ai";
import { route as testRunnerRoute} from "@/api/plugins.test-runner";
import { route as rootRoute } from "@/api/root";

type ResponseType = NonNullable<DescribeRouteOptions["responses"]>[string];

export const validationErrorResponse: ResponseType = {
  description: "Validation error response",
  content: {
    "application/json": {
      schema: resolver(
        z
          .object({
            error: z.literal("ValidationError"),
            message: z.string(),
            detail: z.any(),
          })
          .openapi({
            ref: "ValidationErrorResponse",
          }),
      ),
    },
  },
};

function addDocs(app: Hono, basePath: string) {
  app.get(
    "/openapi",
    openAPISpecs(app, {
      documentation: {
        info: {
          title: "Plugin Service API",
          version: "1.0.0",
        },
        tags: [
          {
            name: "General",
            description: "General endpoints",
          },
          {
            name: "AI Plugin",
            description: "Endpoints for AI plugin interactions",
          },
        ],
      },
    }),
  );

  app.get(
    "/docs",
    Scalar({
      url: `${basePath}/openapi`,
    }),
  );
}

const BASE_PATH = "/api/v1";

export function createApiGateway(broker: ServiceBroker) {
  const api = new Hono().basePath(BASE_PATH);

  api.use("*", cors());

  api.onError((err, c) => {
    logger.error("API error:", err);

    if (err instanceof Errors.ValidationError) {
      return c.json(
        {
          error: "ValidationError",
          message: err.message,
          detail: err.data,
        },
        400,
      );
    }

    return c.json(
      {
        error: "InternalServerError",
        message:
          process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
      },
      500,
    );
  });

  api.use(
    honoLogger((msg: string, ...rest: string[]) => {
      logger.info(
        msg,
        rest.length !== 0 ?
          {
            info: rest,
          }
        : undefined,
      );
    }),
  );

  api.route("/plugins/test-runner", testRunnerRoute(broker));
  api.route("/plugins/ai", aiRoute(broker));
  api.route("/", rootRoute(broker));

  addDocs(api, BASE_PATH);

  return api;
}
