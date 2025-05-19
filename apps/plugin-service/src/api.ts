import type { ApiSettingsSchema } from "moleculer-web";
import type { Result } from "neverthrow";
import process from "node:process";
import ApiGatewayService from "moleculer-web";
import { asError } from "./utils/error";
import logger from "./utils/logger";
import { defineTypedService2 } from "./utils/typed-moleculer";

// TODO: typed the aliases (autocomplete) for better dx
// TODO: maybe move to using hono instead of this ancient gateway

function isNeverthrowResult(obj: any): obj is Result<unknown, unknown> {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.isOk === "function" &&
    typeof obj.isErr === "function"
  );
}

// docs: https://moleculer.services/docs/0.14/moleculer-web
export const apiGateway = defineTypedService2("api-gateway", {
  mixins: [ApiGatewayService],
  settings: {
    port:
      process.env.API_PORT ? Number.parseInt(process.env.API_PORT, 10) : 3000,
    cors: {
      origin: ["http://localhost:5173"],
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    },

    routes: [
      {
        path: "/api/v1/ai",
        aliases: {
          "POST /rubric": "v1.ai.createRubric",
          "POST /grade": "v1.ai.grade",
        },
        bodyParsers: {
          json: true,
        },
        onAfterCall: (ctx, route, req, res, data) => {
          if (isNeverthrowResult(data)) {
            if (data.isOk()) {
              return data.value;
            }

            throw asError(data.error);
          }
        },
        onError: (req, res, err) => {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          if ("code" in err && typeof err.code === "number") {
            res.writeHead(err.code);
          } else {
            res.writeHead(500);
          }
          res.end(JSON.stringify(err));
        },
      },
      {
        path: "/",
        whitelist: ["~node.*"],
      },
    ],
  } satisfies ApiSettingsSchema,
});
