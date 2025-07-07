import type { Context } from "moleculer";
import { defineTypedService2 } from "@grading-system/typed-moleculer/service";
import { toPlainObject } from "@grading-system/utils/neverthrow";
import { coreMessageSchema } from "ai";
import { ZodParams } from "moleculer-zod-validator";
import z from "zod";
import { generateChatResponse, rubricSchema } from "./core";

export const chatRubricActionSchema = z.object({
  messages: z.array(coreMessageSchema).describe("Chat messages"),
  weightInRange: z
    .boolean()
    .nullable()
    .optional()
    .default(null)
    .describe("Type of weight in each level"),
  rubric: rubricSchema.optional().describe("Current rubric"),
  stream: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to stream the response or not"),
});
export const chatRubricActionParams = new ZodParams(chatRubricActionSchema.shape);

export const gradeActionSchema = z.object({
  rubric: rubricSchema,
  prompt: z.string().min(1),
});
export const gradeActionParams = new ZodParams(gradeActionSchema.shape);

export const aiService = defineTypedService2({
  name: "ai",
  version: 1,
  actions: {
    chatRubric: {
      params: chatRubricActionParams.schema,
      handler(ctx: Context<typeof chatRubricActionParams.context>) {
        const params = ctx.params;

        // TODO: fix the underlying response from core.ts
        return toPlainObject(
          generateChatResponse({
            messages: params.messages,
            weightInRange: params.weightInRange,
            rubric: params.rubric,
            stream: params.stream,
          }),
        );

        // return generateChatResponse({
        //   messages: params.messages,
        //   weightInRange: params.weightInRange,
        //   rubric: params.rubric,
        //   stream: params.stream,
        // });
      },
    },
    // grade: {
    //   params: gradeActionParams.schema,
    //   handler(ctx: Context<typeof gradeActionParams.context>) {
    //     const { rubric, prompt } = ctx.params;

    //     if (!rubric) {
    //       throw new Error("Rubric is null or undefined");
    //     }
    //     return gradeUsingRubric(rubric, prompt);
    //   },
    // },
    // test: {
    //   handler(ctx: Context) {
    //     return "hello world";
    //   },
    // },
  },
});

export type AIService = typeof aiService;
