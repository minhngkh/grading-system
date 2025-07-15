// TODO: Update validation logic

import type { CoreMessage, StreamObjectResult } from "ai";
import type { Result, ResultAsync } from "neverthrow";
import type { LanguageModelWithOptions } from "@/core/llm/types";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { generateObject, streamObject } from "ai";
import dedent from "dedent";
import {
  err,
  errAsync,
  fromPromise,
  fromThrowable,
  ok,
  okAsync,
  safeTry,
} from "neverthrow";
import { z } from "zod";
import { googleProviderOptions } from "@/core/llm/providers/google";
import { registry } from "@/core/llm/registry";
import { chatSystemPrompt } from "./prompts/chat";

/**
 * Only works with Gemini model atm, using OpenAi models require schema to use nullable
 * instead of optional. Due to the current (2025-03-23) superior price and speed of Gemini
 * models, just leave it as it is :)
 */
const chatOptions: LanguageModelWithOptions = {
  model: registry.languageModel("google:gemini-2.5-flash-preview"),
  providerOptions: googleProviderOptions["gemini-2.5-flash-preview"]({
    thinking: {
      mode: "disabled",
    },
  }),
};

const gradingOptions: LanguageModelWithOptions = {
  model: registry.languageModel("google:gemini-2.5-flash-preview"),
  providerOptions: googleProviderOptions["gemini-2.5-flash-preview"]({
    thinking: {
      mode: "disabled",
    },
  }),
};

const weightExactSchema = z
  .number()
  .int()
  .describe(
    "weight of the level in the criterion, must be greater than 0 and less than or equal to 100",
  );

const weightRangeSchema = z
  .object({
    max: weightExactSchema.describe("maximum value, can be equal"),
    min: weightExactSchema.describe("minimum value, must not be equal"),
  })
  .describe(
    "When grading this rubric, if the criterion met the level's description, the score should be lower or equal to the criterion's max weight and higher than the min weight",
  );

function createRubricSchema(weightInRange: boolean) {
  // FIXME: need to remove min(2) at tags if using gpt model
  return z.object({
    rubricName: z
      .string()
      .optional()
      .describe("name of the rubric, should not be empty in most cases"),
    weightInRange: z
      .literal(weightInRange ? "true" : "false")
      .describe(
        "whether the weight of each criteria's level should be in a range or an exact number",
      ),
    tags: z.array(z.string()).describe("tags for each level in each criterion"),
    criteria: z.array(
      z.object({
        name: z.string().describe("name of the criterion"),
        weight: z
          .number()
          .int()
          .describe(
            "weight of the criterion in the rubric, must be greater than 0 and less than or equal to 100",
          ),
        levels: z
          .array(
            z.object({
              tag: z
                .string()
                .describe(
                  "tag of the level, must be one of the rubric's performance tags",
                ),
              weight: weightInRange ? weightRangeSchema : weightExactSchema,
              description: z.string(),
            }),
          )
          .describe("levels of the criterion"),
      }),
    ),
  });
}

function createChatResponseSchema(rubricSchema: z.ZodSchema) {
  return z.object({
    rubric: rubricSchema
      .nullable()
      .describe("The rubric object, or null if not applicable"),
    message: z.string().describe("Explanation of the action taken response to the user"),
  });
}

const rubricSchemaVariant = {
  weightInRange: createRubricSchema(true),
  weightNotInRange: createRubricSchema(false),
};
export const rubricSchema = z.discriminatedUnion("weightInRange", [
  rubricSchemaVariant.weightInRange,
  rubricSchemaVariant.weightNotInRange,
]);
export type Rubric = z.infer<typeof rubricSchema>;

const chatResponseSchemaVariant = {
  weightInRange: createChatResponseSchema(rubricSchemaVariant.weightInRange),
  weightNotInRange: createChatResponseSchema(rubricSchemaVariant.weightNotInRange),
};
export const chatResponseSchema = createChatResponseSchema(rubricSchema);
export type ChatResponse = z.infer<typeof chatResponseSchema>;

function validateChatResponse(chatResponse: ChatResponse): Result<void, Error> {
  if (chatResponse.rubric) {
    for (const criterion of chatResponse.rubric.criteria) {
      for (const level of criterion.levels) {
        if (!chatResponse.rubric!.tags.includes(level.tag)) {
          return err(new Error(`\`tag\` must be one of the rubric's \`tags\``));
        }
      }
    }
  }

  return ok();
}

type ActualChatResponse =
  | {
      stream: false;
      result: ChatResponse;
    }
  | {
      stream: true;
      result: StreamObjectResult<unknown, ChatResponse, never>;
    };

/**
 *
 * @param options - The options for generating the chat response
 * @param options.messages - The messages to send to the LLM, must end with a user message
 * @param options.weightInRange - Whether the weight of each criterion's level should be
 * in a range or an exact number, defaults to `null` (not specified)
 * @param options.rubric - The current rubric
 * @param options.stream - Whether to stream the response or not, defaults to `false`
 * @returns Chat response or stream of it
 */
export function generateChatResponse(options: {
  messages: CoreMessage[];
  weightInRange?: boolean | null;
  rubric?: Rubric;
  stream?: boolean;
}): ResultAsync<ActualChatResponse, Error> {
  return safeTry(async function* () {
    const toStream = options.stream ?? false;
    const hasWeightInRange =
      typeof options.weightInRange === "undefined" ? null : options.weightInRange;

    let outputSchema;
    switch (hasWeightInRange) {
      case null:
        outputSchema = chatResponseSchema;
        break;
      case true:
        outputSchema = chatResponseSchemaVariant.weightInRange;
        break;
      case false:
        outputSchema = chatResponseSchemaVariant.weightNotInRange;
        break;
    }

    // if (currentMessage.role !== "user") {
    //   return err(new Error("The last message must be from the user"));
    // }

    if (options.rubric) {
      logger.info("Updating existing rubric using LLM");

      options.messages.splice(-1, 0, {
        role: "user",
        content: dedent`
        This is my current rubric:
        \`\`\`json
        ${JSON.stringify(options.rubric, null, 2)}
        \`\`\`
      `,
      });
    } else {
      logger.info("Creating new rubric using LLM");
    }

    if (!toStream) {
      const responseResult = yield* fromPromise(
        generateObject({
          ...chatOptions,
          schema: outputSchema,
          system: chatSystemPrompt,
          messages: options.messages,
        }),
        (error) =>
          wrapError(error, `Failed to ${options.rubric ? "update" : "create"} rubric`),
      );

      const response = responseResult.object;

      const validationResult = validateChatResponse(response);
      if (validationResult.isErr()) {
        return errAsync(wrapError(validationResult.error, "Invalid response from LLM"));
      }

      return okAsync({
        stream: false,
        result: response,
      } as ActualChatResponse);
    } else {
      const safeStreamObject = fromThrowable(
        () =>
          streamObject({
            ...chatOptions,
            schema: outputSchema,
            system: chatSystemPrompt,
            messages: options.messages,
          }),
        (error) =>
          wrapError(
            error,
            `Failed to ${options.rubric ? "update" : "create"} rubric (stream)`,
          ),
      );

      const responseResult = yield* safeStreamObject();
      // if (responseResult.isErr()) {
      //   return err(
      //     wrapError(
      //       responseResult.error,
      //       `Failed to ${options.rubric ? "update" : "create"} rubric (stream)`,
      //     ),
      //   );
      // }

      return okAsync({
        stream: true,
        result: responseResult,
      } as ActualChatResponse);
    }
  });
}

export const feedbackSchema = z.object({
  comment: z.string().describe("short comment about the reason"),
  fileRef: z.string().describe("The file that the comment refers to"),
  position: z
    .object({
      fromLine: z.number().int(),
      fromColumn: z.number().int().optional(),
      toLine: z.number().int(),
      toColumn: z.number().int().optional(),
    })
    .describe(
      "Position of part of the files to highlight the reason why you conclude to that comment, this is relative to the file itself",
    ),
});

export const gradingResultSchema = z.object({
  rubricName: z.string().describe("name of the rubric"),
  results: z
    .array(
      z.object({
        criterion: z
          .string()
          .describe(
            "name of the criterion that is graded, must be the name of one of the rubric's criteria",
          ),
        tag: z.string().describe("tag of the level that the score reached"),
        score: z.number().int().describe("score of the criterion"),
        // feedback: z.array(z.string()),
        feedback: z
          .array(feedbackSchema)
          .describe("feedback reasons for the grading score"),
        summary: z
          .string()
          .optional()
          .describe("summary feedback for the grading result"),
      }),
    )
    .describe("grading results for each criterion in the rubric"),
});

type GradingResult = z.infer<typeof gradingResultSchema>;

function validateGradingResult(
  rubric: Rubric,
  gradingResult: GradingResult,
): Result<void, Error> {
  for (const critRes of gradingResult.results) {
    if (!rubric.tags.includes(critRes.tag)) {
      return err(
        new Error(`\`performanceTag\` must be one of the rubric's \`performanceTags\``),
      );
    }

    const criterion = rubric.criteria.find(
      (criterion) => criterion.name === critRes.criterion,
    );
    if (!criterion) {
      return err(new Error(`\`criterion\` must be one of the rubric's \`criteria\``));
    }

    // low to high
    const sortedLevels = [
      ...criterion.levels.map((level) => {
        if (typeof level.weight === "number") {
          // Have to do this since ts can't infer
          return {
            ...level,
            weight: level.weight,
          };
        }
        return {
          ...level,
          weight: level.weight.max,
        };
      }),
    ].sort((a, b) => {
      return a.weight - b.weight;
    });

    const levelIdx = sortedLevels.findIndex((level) => level.tag === critRes.tag);
    if (levelIdx === -1) {
      return err(
        new Error(`\`tag\` must be one of the criterion's \`levels\`'s \`tag\``),
      );
    }

    if (critRes.score > sortedLevels[levelIdx].weight) {
      return err(
        new Error(
          `\`score\`(${critRes.score}) must be less than or equal to the criterion's \`weight\`(${sortedLevels[levelIdx].weight})`,
        ),
      );
    } else if (levelIdx !== 0 && critRes.score <= sortedLevels[levelIdx - 1].weight) {
      return err(
        new Error(
          `\`score\`(${critRes.score}) must be greater than the next lower level's \`weight\`(${sortedLevels[levelIdx - 1].weight})`,
        ),
      );
    }
  }

  return ok();
}

function createGradingSystemPrompt(rubric: Rubric) {
  return dedent`
    - You are a helpful AI assistant that grades the input using the provided rubric bellow

    ### Rubric used for grading
    - The exact rubric that you should use for grading:
    \`\`\`json
    ${JSON.stringify(rubric)}
    \`\`\`


    ### Instructions
    - The input you will be given is generated using repomix, it will show you the structure and content of all the files that you will use to grade
    - Here are some more detailed specs of the output:
      - You must grade all of the criterion that is in the "criteria" array of the rubric
      - You must grade the criterion by reading the level description then give and choose the one that is the most appropriate for the input
      - The score must be exactly the same as the level's weight (or if it contains a max and min value, then the graded score must be both: lower or equal to the max value; higher and *must not* equal to the min value. for example, if "weight": { "max": 100, "min":75 }, the score should be in range 75 < score <= 100).
      - If the score you gave:
        - is 100, you don't have to provide any detailed feedback in the \`feedback\` field
        - is less than 100, you should provide a detailed feedback in the \`feedback\` field, explaining why you gave that score and highlighting the part of the input that you based your decision on, if applicable
  `;
}

/**
 * @deprecated
 */
export async function gradeUsingRubric(
  rubric: Rubric,
  prompt: string,
): Promise<Result<GradingResult, Error>> {
  logger.info("Grading using LLM");

  const gradingSystemPrompt = createGradingSystemPrompt(rubric);

  const responseResult = await fromPromise(
    generateObject({
      model: gradingOptions.model,
      schema: gradingResultSchema,
      system: gradingSystemPrompt,
      prompt,
    }),
    asError,
  );
  if (responseResult.isErr()) {
    return err(wrapError(responseResult.error, "Failed to grade"));
  }

  const gradingRes = responseResult.value.object;

  const validationResult = validateGradingResult(rubric, gradingRes);
  if (validationResult.isErr()) {
    return err(
      wrapError(validationResult.error, "Invalid grading result getting from LLM"),
    );
  }
  return ok(gradingRes);
}
