// TODO: Update validation logic

import type { Result } from "neverthrow";
import type { Model } from "./providers";
import { asError, wrapError } from "@/utils/error";
import logger from "@/utils/logger";
import { err, fromPromise, ok } from "neverthrow";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { getClient } from "./providers";

const DEFAULT_MODEL: Model = "gpt-4o-mini";

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

const weightSchema = z.union([weightExactSchema, weightRangeSchema]);

type weightSchemaType =
  | typeof weightSchema
  | typeof weightExactSchema
  | typeof weightRangeSchema;

function generateRubricSchema(schema: weightSchemaType) {
  // need to remove min(2) at tags if using gpt model 
  return z.object({
    rubricName: z.string(),
    tags: z
      .array(z.string())
      .describe("tags for each level in each criterion"),
    criteria: z.array(
      z.object({
        name: z.string().describe("name of the criterion"),
        weight: weightExactSchema.describe(
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
              weight: schema,
              description: z.string(),
            }),
          )
          .describe("levels of the criterion"),
      }),
    ),
  });
}

function generateRubricResponseSchema(schema: weightSchemaType) {
  const rubricSchema = generateRubricSchema(schema);

  return z.object({
    message: z.string().describe("A natural language response message"),
    rubric: rubricSchema.nullable().describe("The rubric object, or null if not applicable"),
  });
}
 

export const rubricSchema = generateRubricResponseSchema(weightSchema);

function generateCreateRubricPrompt(scoreInRange: boolean) {

  const rubricOnlySchema = generateRubricSchema(scoreInRange ? weightRangeSchema : weightExactSchema,);
  const outputSchema = generateRubricResponseSchema(scoreInRange ? weightRangeSchema : weightExactSchema,);
  const systemPrompt = `
You are a helpful AI assistant that can create or update a grading rubric based on the user's input.

You must always return a JSON object with:
- \`message\`: a natural-language response string
- \`rubric\`: the rubric object if applicable, or \`null\` if the input is a general question

---

Determine the intent of the input:
- If the input is a **general question** (e.g. about grading concepts, tags, or weights), answer helpfully and set \`rubric\` to \`null\`.
- If the input is a **rubric request** (e.g. to create, revise, or clarify a rubric), return a valid rubric and set it in the \`rubric\` field.

---

### JSON output schema
\`\`\`json
${JSON.stringify(zodToJsonSchema(outputSchema, "rubric"), null, 2)}
\`\`\`


### Instructions
Here are some more specific specifications of the output:
  - The \`tag\` of each criterion's level must be one of the rubric's \`tags\`
  - criteria's levels do not have to include all the performance tags
  - Total weight of all criteria must add up to 100% and no criteria's weight is 0
  - tags for each level in each criterion are used as an id to differentiate each levels and must be numbers like ['0', '1', '2', '3']. Level with the lower tag value is the higher weight level
  ${
    scoreInRange ?
      `
  - The \`weight\` of each criterion's level must have the max value equal to the higher level's weight (if exists) and the min value equal to the lower level's weight (if exists)
  - The max weight of the highest level must be 100
  - The min weight of the lowest level must be 0
  `
    : `
  - The \`weight\` of the highest \`weight\` must be 100
  `
  }
`;

  return {
    systemPrompt,
    outputSchema,
    rubricOnlySchema,
  };
}

export type ResponseRubric = z.infer<
  ReturnType<typeof generateCreateRubricPrompt>["outputSchema"]
>;
export type Rubric = z.infer<
  ReturnType<typeof generateCreateRubricPrompt>["rubricOnlySchema"]
>;

function validateRubric(responseRubric: ResponseRubric): Result<void, Error> {
  if(responseRubric.rubric) {
    for (const criterion of responseRubric.rubric.criteria) {
      for (const level of criterion.levels) {
        if (!responseRubric.rubric!.tags.includes(level.tag)) {
          return err(new Error(`\`tag\` must be one of the rubric's \`tags\``));
        }
      }
    }
  }

  return ok();
}

/**
 *
 * @param prompt
 * @param scoreInRange whether the score should be in the range of the criterion's weight and the next lower level's weight
 * @returns the rubric
 */
export async function createRubric(
  prompt: string,
  scoreInRange: boolean = false,
  rubric ?: Rubric,
): Promise<Result<ResponseRubric, Error>> {
  const { outputSchema, systemPrompt } =
    generateCreateRubricPrompt(scoreInRange);

  const client = getClient(DEFAULT_MODEL, systemPrompt);
  if (rubric){
    // Update: use the existing rubric and the prompt to generate an updated rubric
    logger.info("Updating existing rubric using LLM");
    const updatedPrompt = `
    You are a helpful AI assistant that updates an existing grading rubric based on the user's input.
You must always return a JSON object with:
- \`message\`: a natural-language response string
- \`rubric\`: the rubric object if applicable, or \`null\` if the input is a general question

---

Determine the intent of the input:
- If the input is a **general question** (e.g. about grading concepts, tags, or weights), answer helpfully and set \`rubric\` to \`null\`.
- If the input is a **rubric request** (e.g. to create, revise, or clarify a rubric), return a valid rubric and set it in the \`rubric\` field.

### Existing Rubric
\`\`\`json
${JSON.stringify(rubric, null, 2)}
\`\`\`

### User's Input
${prompt}

---

### JSON output schema
\`\`\`json
${JSON.stringify(zodToJsonSchema(outputSchema, "rubric"), null, 2)}
\`\`\`

### Instructions
Here are some more specific specifications of the output:
  - The \`tag\` of each criterion's level must be one of the rubric's \`tags\`
  - criteria's levels do not have to include all the performance tags
  - Total weight of all criteria must add up to 100% and no criteria's weight is 0
  - tags for each level in each criterion are used as an id to differentiate each levels and must be numbers like ['0', '1', '2', '3']. Level with the lower tag value is the higher weight level
  ${
    scoreInRange ?
      `
  - The \`weight\` of each criterion's level must have the max value equal to the higher level's weight (if exists) and the min value equal to the lower level's weight (if exists)
  - The max weight of the highest level must be 100
  - The min weight of the lowest level must be 0
  `
    : `
  - The \`weight\` of the highest \`weight\` must be 100
  `
  }
`;
    const responseResult = await fromPromise(
      client.generate(updatedPrompt, outputSchema, "rubric"),
      asError,
    );
    if (responseResult.isErr()) {
      return err(wrapError(responseResult.error, "Failed to update rubric"));
    }

    const updatedRubric = responseResult.value;
    logger.debug("Updated rubric", updatedRubric);

    const validationResult = validateRubric(updatedRubric);
    if (validationResult.isErr()) {
      return err(
        wrapError(validationResult.error, "Invalid updated rubric from LLM"),
      );
    }

    return ok(updatedRubric);
  } else{
    const responseResult = await fromPromise(
      client.generate(prompt, outputSchema, "rubric"),
      asError,
    );
    if (responseResult.isErr()) {
      return err(wrapError(responseResult.error, "Failed to generate rubric"));
    }

    const _rubric = responseResult.value;
    // console.log("Generated rubric:", JSON.stringify(rubric, null, 2));
    logger.debug("Generated rubric", rubric);

    const validationResult = validateRubric(_rubric);
    if (validationResult.isErr()) {
      return err(
        wrapError(validationResult.error, "Invalid rubric getting from LLM"),
      );
    }
    return ok(_rubric);
  }
}

export const feedbackSchema = z.object({
  comment: z.string().describe("short comment about the reason"),
  fileRef: z
    .string()
    .optional()
    .describe(
      "The url to the file that the comment refers to, not required",
    ),
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
  responseRubric: ResponseRubric,
  gradingResult: GradingResult,
): Result<void, Error> {
  if (responseRubric.rubric){
    for (const critRes of gradingResult.results) {
      if (!responseRubric.rubric.tags.includes(critRes.tag)) {
        return err(
          new Error(
            `\`performanceTag\` must be one of the rubric's \`performanceTags\``,
          ),
        );
      }

      const criterion = responseRubric.rubric.criteria.find(
        (criterion) => criterion.name === critRes.criterion,
      );
      if (!criterion) {
        return err(
          new Error(`\`criterion\` must be one of the rubric's \`criteria\``),
        );
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

      const levelIdx = sortedLevels.findIndex(
        (level) => level.tag === critRes.tag,
      );
      if (levelIdx === -1) {
        return err(
          new Error(
            `\`tag\` must be one of the criterion's \`levels\`'s \`tag\``,
          ),
        );
      }

      if (critRes.score > sortedLevels[levelIdx].weight) {
        return err(
          new Error(
            `\`score\`(${critRes.score}) must be less than or equal to the criterion's \`weight\`(${sortedLevels[levelIdx].weight})`,
          ),
        );
      } else if (
        levelIdx !== 0 &&
        critRes.score <= sortedLevels[levelIdx - 1].weight
      ) {
        return err(
          new Error(
            `\`score\`(${critRes.score}) must be greater than the next lower level's \`weight\`(${sortedLevels[levelIdx - 1].weight})`,
          ),
        );
      }
    }
  }

  return ok();
}

function generateGradingPrompt(responseRubric: ResponseRubric) {
  const prompt = `
- You are a helpful AI assistant that grades the input using the provided rubric bellow

### JSON output schema
- The output should be in JSON format that matches following \`gradingResult\` schema:
\`\`\`json
${JSON.stringify(zodToJsonSchema(gradingResultSchema, "gradingResult"), null, 2)}
\`\`\`

### Rubric used for grading
- The exact rubric that you should use for grading:
\`\`\`json
${JSON.stringify(responseRubric)}
\`\`\`


### Instructions
- Here are some more detailed specs of the output:
  - You must grade all of the criterion that is in the "criteria" array of the rubric
  - You must grade the criterion by reading the level description then give and choose the one that is the most appropriate for the input
  - The score must be exactly the same as the level's weight (or if it contains a max and min value, then the graded score must be both: lower or equal to the max value; higher and *must not* equal to the min value. for example, if "weight": { "max": 100, "min":75 }, the score should be in range 75 < score <= 100).
  - If the input does not provide any information about the what file it is referring to, you can just ignore the \`fileRef\` field
`;

  return prompt;
}

export async function gradeUsingRubric(
  responseRubric: ResponseRubric,
  prompt: string,
): Promise<Result<GradingResult, Error>> {
  const gradingPrompt = generateGradingPrompt(responseRubric);
  const client = getClient(DEFAULT_MODEL, gradingPrompt);

  const responseResult = await fromPromise(
    client.generate(prompt, gradingResultSchema, "gradingResult"),
    asError,
  );
  if (responseResult.isErr()) {
    return err(wrapError(responseResult.error, "Failed to grade"));
  }

  const gradingRes = responseResult.value;
  logger.debug("Grading result", gradingRes);

  const validationResult = validateGradingResult(responseRubric, gradingRes);
  if (validationResult.isErr()) {
    return err(
      wrapError(
        validationResult.error,
        "Invalid grading result getting from LLM",
      ),
    );
  }

  return ok(gradingRes);
}
