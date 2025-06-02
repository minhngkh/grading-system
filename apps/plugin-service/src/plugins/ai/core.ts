// TODO: Update validation logic

import type { CoreMessage, StreamObjectResult } from "ai";
import type { Result } from "neverthrow";
import type { LanguageModelWithOptions } from "@/internal/llm/types";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { generateObject, streamObject } from "ai";
import dedent from "dedent";
import { err, fromPromise, fromThrowable, ok } from "neverthrow";
import { z } from "zod";
import { googleProviderOptions } from "@/internal/llm/providers/google";
import { registry } from "@/internal/llm/registry";

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
    rubricName: z.string(),
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
    message: z
      .string()
      .describe("Explanation of the action taken response to the user"),
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

// TODO: Add scoreInRange
// TODO: Refine the prompt to completely block out of scope usage
// TODO: Try to enforce property order when streaming
const chatSystemPrompt = dedent`
  You are a helpful AI assistant that can create and update a rubric used for grading based on the user's input, or just answer general questions that resolves around creating rubric and using it for grading.

  ---

  ### Decision Logic
  - If the user's input is a **general question** (e.g. about grading, rubrics, tags, or weights), you must:
    - Return \`rubric: null\`
    - Provide the answer to the question naturally in the \`message\` field
    - Ignore any provided rubric
  - If the input is a **rubric request** (creating or updating a rubric):
    - update the \`rubric\` field with the new or updated rubric
    - After creating/updating the rubric, provide back a detailed message about what you have done in the \`message\` field and reason behind it (if needed)

  ---

  ### Instructions
  Here are some more specific specifications of the output:
    - The \`tag\` of each criterion's level must be one of the rubric's \`tags\`
    - criteria's levels do not have to include all the performance tags
    - Total weight of all criteria must add up to 100% and no criteria's weight is 0
    - tags for each level in each criterion are used as an id to differentiate each levels and must be numbers like ['0', '1', '2', '3']. Level with the lower tag value is the higher weight level
    - Depends on the \`weightInRange\` value:
      - If \`weightInRange\` is \`true\`:
        - The \`weight\` of each criterion's level must have the max value equal to the higher level's weight (if exists) and the min value equal to the lower level's weight (if exists)
        - The max weight of the highest level must be 100
        - The min weight of the lowest level must be 0
    - The \`weight\` of the highest \`weight\` must be 100
    - When there is mismatch in \`weightInRange\` of the current rubric and the output rubric that force you to change the \`weightInRange\` value, you must notify the user about this in the \`message\` field
`;

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
export async function generateChatResponse(options: {
  messages: CoreMessage[];
  weightInRange?: boolean | null;
  rubric?: Rubric;
  stream?: boolean;
}): Promise<Result<ActualChatResponse, Error>> {
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
    const responseResult = await fromPromise(
      generateObject({
        ...chatOptions,
        schema: outputSchema,
        system: chatSystemPrompt,
        messages: options.messages,
      }),
      asError,
    );
    if (responseResult.isErr()) {
      console.debug(responseResult.error)
      return err(
        wrapError(
          responseResult.error,
          `Failed to ${options.rubric ? "update" : "create"} rubric`,
        ),
      );
    }

    const response = responseResult.value.object;

    const validationResult = validateChatResponse(response);
    if (validationResult.isErr()) {
      return err(wrapError(validationResult.error, "Invalid response from LLM"));
    }

    return ok({
      stream: false,
      result: response,
    });
  } else {
    const safeStreamObject = fromThrowable(
      () =>
        streamObject({
          ...chatOptions,
          schema: outputSchema,
          system: chatSystemPrompt,
          messages: options.messages,
        }),
      asError,
    );

    const responseResult = safeStreamObject();
    if (responseResult.isErr()) {
      return err(
        wrapError(
          responseResult.error,
          `Failed to ${options.rubric ? "update" : "create"} rubric (stream)`,
        ),
      );
    }

    return ok({
      stream: true,
      result: responseResult.value,
    });
  }
}

export const feedbackSchema = z.object({
  comment: z.string().describe("short comment about the reason"),
  fileRef: z
    .string()
    .optional()
    .describe("The url to the file that the comment refers to, not required"),
  position: z
    .object({
      fromLine: z.number().int(),
      fromColumn: z.number().int().optional(),
      toLine: z.number().int(),
      toColumn: z.number().int().optional(),
    })
    .describe(
      "The position of the part where it conclude to the comment, relative to the the file (if any)",
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
    - Here are some more detailed specs of the output:
      - You must grade all of the criterion that is in the "criteria" array of the rubric
      - You must grade the criterion by reading the level description then give and choose the one that is the most appropriate for the input
      - The score must be exactly the same as the level's weight (or if it contains a max and min value, then the graded score must be both: lower or equal to the max value; higher and *must not* equal to the min value. for example, if "weight": { "max": 100, "min":75 }, the score should be in range 75 < score <= 100).
      - If the input does not provide any information about the what file it is referring to, you can just ignore the \`fileRef\` field
  `;
}

export async function gradeUsingRubric(
  rubric: Rubric,
  prompt: string,
): Promise<Result<GradingResult, Error>> {
  logger.info("Grading using LLM");

  const gradingSystemPrompt = createGradingSystemPrompt(rubric);

  const responseResult = await fromPromise(
    generateObject({
      ...gradingOptions,
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
