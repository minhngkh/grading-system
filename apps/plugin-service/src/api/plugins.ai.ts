import "zod-openapi/extend";

import type { ServiceBroker } from "moleculer";
import type { ZodOpenApiObject } from "zod-openapi";
import type { AIService } from "@/plugins/ai/service";
import { actionCaller } from "@grading-system/typed-moleculer/action";
import { coreMessageSchema } from "ai";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { stream } from "hono/streaming";
import z from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { validationErrorResponse } from "@/api/index";
import { chatResponseSchema } from "@/plugins/ai/core";
import { chatRubricActionSchema } from "@/plugins/ai/service";

const postRubricChatRequestSchema = chatRubricActionSchema
  .extend({
    messages: z
      .array(coreMessageSchema)
      .describe("Chat messages")
      .openapi(
        zodToJsonSchema(z.array(coreMessageSchema), {
          basePath: [`#/components/schemas/coreMessages`],
        }) as ZodOpenApiObject,
      ),
  })
  .openapi({
    example: {
      messages: [
        {
          role: "user",
          content: "Create a rubric for evaluating code snippet",
        },
      ],
    },
  });
const postRubricChatResponseSchema = chatResponseSchema;

export function route(broker: ServiceBroker) {
  return new Hono().post(
    "/chat",
    describeRoute({
      tags: ["AI Plugin"],
      description: "Chat endpoint for creating a rubric",
      responses: {
        200: {
          description: "Successful response (either stream or json)",
          content: {
            "application/json": {
              schema: resolver(postRubricChatResponseSchema),
            },
            "text/plain": {
              schema: resolver(postRubricChatResponseSchema.partial()),
            },
          },
        },
        400: validationErrorResponse,
      },
    }),
    validator("json", postRubricChatRequestSchema),
    async (c) => {
      const body = c.req.valid("json");

      const responseResult = await actionCaller<AIService>()(
        broker,
        "v1.ai.chatRubric",
        body,
      );

      if (responseResult.isErr()) {
        throw responseResult.error;
      }

      const response = responseResult.value;

      if (!response.stream) {
        return c.json(response.result);
      }

      return stream(c, (stream) => {
        return stream.pipe(response.result.textStream);
      });
      // return response.result.toTextStreamResponse()

      // TODO: Test this versus using response.result.toTextStreamResponse directly
      // TODO: Checkout the new SSE stream protocol in alpha version of the sdk
    },
  );
}
