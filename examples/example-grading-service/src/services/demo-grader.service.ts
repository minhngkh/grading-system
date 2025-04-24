import {
  DemoGradingResultsObjSchema,
  SubmissionGradingRequested as DemoSubmissionGradingRequested,
} from "@/events/demo";
import {
  GradingCriterionsCompleted,
  GradingRubricFailed,
} from "@/events/grading";
import { emitEvent } from "@/utils/events";
import {
  defineEventHandler,
  defineTypedService,
} from "@/utils/typed-moleculer";
import ApiService from "moleculer-web";
import { ZodParams } from "moleculer-zod-validator";
import { z } from "zod";
import type { SupportedModels } from "./ai-wrapper.service";

const DEFAULT_MODEL: SupportedModels = "gemini-2.0-flash";

const schema = `
{
  "type": "object",
  "properties": {
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "criterion": {
            "type": "string",
            "description": "The name or identifier of the grading criterion."
          },
          "score": {
            "type": "number",
            "description": "The numeric score assigned for this criterion."
          },
          "feedback": {
            "type": "string",
            "description": "Constructive feedback for this criterion."
          },
          "fileReference": {
            "type": "string",
            "format": "uri",
            "description": "A URL referencing the file being graded."
          },
          "position": {
            "type": "object",
            "description": "The position of the mistakes that lead to the deduction",
            "properties": {
              "fromLine": {
                "type": "number",
                "description": "Starting line number."
              },
              "fromColumn": {
                "type": "number",
                "description": "Optional. Starting column number."
              },
              "toLine": {
                "type": "number",
                "description": "Ending line number."
              },
              "toColumn": {
                "type": "number",
                "description": "Optional. Ending column number."
              }
            },
            "required": ["fromLine", "toLine"]
          }
        },
        "required": ["criterion", "score", "feedback", "fileReference", "position"]
      }
    }
  },
  "required": ["results"]
}
`;

export const GradingService = defineTypedService({
  name: "grading-service",
  mixins: [ApiService],
  settings: {
    port: process.env.GRADING_API_PORT || 3001,
    routes: [
      {
        path: "/api",
        aliases: {
          "POST /grade-demo": "grading-service.gradeDemo",
        },
        cors: {
          origin: "*",
          methods: ["GET", "OPTIONS", "POST"],
        },
      },
    ],
  },
  methods: {},
  actions: {
    /**
     * HTTP endpoint to grade a submission with rubric and code.
     */
    gradeDemo: {
      params: new ZodParams({
        rubricPrompt: z.string(),
        fileText: z.string(),
        taskId: z.string().optional(),
      }).schema,
      async handler(ctx) {
        const {
          rubricPrompt,
          fileText,
          taskId = `demo-task-${Date.now()}`,
        } = ctx.params;
        const systemPrompt = [
          "You are a university computer science teacher evaluating a code snippet. Use the provided rubric to assess the code snippet across each criterion, assigning scores and giving constructive feedback. Output the evaluation in JSON format",
          rubricPrompt,
          "\nOutput JSON schema:",
          schema,
        ].join("\n\n");
        let gradingResult: unknown;
        try {
          const res = await ctx.call("ai-wrapper.chat", {
            modelName: DEFAULT_MODEL,
            systemPrompt,
            prompt: fileText,
            structuredOutput: true,
          });
          gradingResult = res;
        } catch (e) {
          return {
            success: false,
            error: `Failed to get grading result: ${e}`,
          };
        }
        const validation = DemoGradingResultsObjSchema.safeParse(gradingResult);
        if (validation.success) {
          return {
            success: true,
            results: validation.data.results,
          };
        }
        return {
          success: false,
          error: "Failed to get grading result",
        };
      },
    },
  },
  events: {
    [DemoSubmissionGradingRequested.name]: defineEventHandler(
      DemoSubmissionGradingRequested,
      /**
       * Handles grading request: builds prompt, simulates grading, validates result, emits completed/failed event.
       */
      async (ctx) => {
        const { taskId, rubricPrompt, fileText } = ctx.params;
        // Build system prompt
        const systemPrompt = [
          "You are a university computer science teacher evaluating a code snippet. Use the provided rubric to assess the code snippet across each criterion, assigning scores and giving constructive feedback. Output the evaluation in JSON format",
          rubricPrompt,
          "\nOutput JSON schema:",
          schema,
        ].join("\n\n");

        // Simulate AI grading: for demo, just try to parse fileText as JSON result
        let gradingResult: unknown;
        try {
          const res = (await ctx.call("ai-wrapper.chat", {
            modelName: DEFAULT_MODEL,
            systemPrompt: systemPrompt,
            prompt: fileText,
            structuredOutput: true,
          })) as string;

          gradingResult = res;
        } catch (e) {
          emitEvent(ctx.broker, GradingRubricFailed, {
            taskId: taskId,
            error: `Failed to get grading result: ${e}`,
            timestamp: new Date().toISOString(),
          });
          return;
        }
        // Validate result
        const validation = DemoGradingResultsObjSchema.safeParse(gradingResult);
        if (validation.success) {
          emitEvent(ctx.broker, GradingCriterionsCompleted, {
            taskId: taskId,
            timestamp: new Date().toISOString(),
            results: validation.data.results,
          });
        } else {
          // console.log("Validation failed:", validation.error);

          emitEvent(ctx.broker, GradingRubricFailed, {
            taskId: taskId,
            error: "Failed to get grading result",
            timestamp: new Date().toISOString(),
          });
        }
      }
    ),
  },
});
