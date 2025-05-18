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
      origin: ["localhost:5173"],
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    },

    routes: [
      {
        path: "/api/v1",
        aliases: {
          "GET /plugins": "api-gateway.listPlugins",
          "GET /categories": "api-gateway.listCategories",
        }
      },
      {
        path: "/api/v1/plugins/ai",
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
  actions: {
    listPlugins() {
      const mockResponse = [
        {
          id: "d3219888-75d8-4a75-9045-83c1b4929bde",
          category: null,
          name: "AI",
          description: "Generate rubric and grade using it",
          url: "/api/v1/plugins/ai",
        },
        {
          id: "a8fd5cb1-4ce3-473b-80ad-6f303c9def72",
          category: null,
          name: "Code Runner",
          description: "Generate and run tests for your code",
          url: "/api/v1/plugins/code-runner",
        }
      ]

      return mockResponse;
    },
    listCategories() {
      const mockResponse = [
        {
          id: "1437b679-55fb-4bcc-b7fd-b85e9cf4adf4",
          slug: "general",
          name: "General Purpose",
          description: "General purpose plugins",
        }
      ]

      return mockResponse;
    }
  }
});
