import type { Context } from "moleculer";
import { defineTypedService2 } from "@/utils/typed-moleculer";
import { ZodParams } from "moleculer-zod-validator";
import { z } from "zod";
import { createRubric, gradeUsingRubric, rubricSchema } from "./core";

const createRubricParams = new ZodParams({
  prompt: z.string().min(1, "Prompt is required"),
  scoreInRange: z.boolean().default(false).optional(),
});

const gradeParams = new ZodParams({
  rubric: rubricSchema,
  prompt: z.string().min(1, "Prompt is required"),
});

export const aiService = defineTypedService2("ai", {
  version: 1,
  actions: {
    createRubric: {
      params: createRubricParams.schema,
      handler(ctx: Context<typeof createRubricParams.context>) {
        const { prompt, scoreInRange } = ctx.params;

        return createRubric(prompt, scoreInRange);
      },
    },
    grade: {
      params: gradeParams.schema,
      handler(ctx: Context<typeof gradeParams.context>) {
        const { rubric, prompt } = ctx.params;

        return gradeUsingRubric(rubric, prompt);
      },
    },
    test: {
      handler(ctx) {
        return "hello world";
      },
    },
  },
});

export type AIService = typeof aiService;
