import type { Result } from "neverthrow";
import type { LanguageModelWithOptions } from "@/core/llm/types";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { generateObject } from "ai";
import dedent from "dedent";
import { err, ok, ResultAsync } from "neverthrow";
import z from "zod";
import { googleProviderOptions } from "@/core/llm/providers/google";
import { registry } from "@/core/llm/registry";
import { packSubmission } from "@/plugins/ai/pack-files";

const llmOptions: LanguageModelWithOptions = {
  model: registry.languageModel("google:gemini-2.5-flash-preview"),
  providerOptions: googleProviderOptions["gemini-2.5-flash-preview"]({
    thinking: {
      mode: "disabled",
    },
  }),
};

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

export const criterionGradingResultSchema = z.object({
  criterion: z
    .string()
    .describe(
      "name of the criterion that is graded, must be the name of one of the rubric's criteria",
    ),
  tag: z.string().describe("tag of the level that the score reached"),
  score: z.number().int().describe("score of the criterion"),
  // feedback: z.array(z.string()),
  feedback: z.array(feedbackSchema).describe("feedback reasons for the grading score"),
  summary: z.string().optional().describe("summary feedback for the grading result"),
});

type CriterionGradingResult = z.infer<typeof criterionGradingResultSchema>;

interface GradingCriterion {
  criterion: string;
  levels: {
    tag: string;
    description: string;
    weight: number;
  }[];
}

interface GradingCriterionData extends GradingCriterion {
  fileRefs: string[];
  plugin: string;
  configuration: string;
}

function createGradingSystemPrompt(partOfRubric: GradingCriterion[]) {
  return dedent`
    - You are a helpful AI assistant that grades the input using the provided rubric bellow

    ### rubric used for grading
    - This is what you will use for grading:
    \`\`\`json
    ${JSON.stringify(partOfRubric, null, 2)}
    \`\`\`


    ### Instructions
    - The input you will be given is generated using repomix, it will show you the structure and content of all the files that you will use to grade
    - Here are some more detailed specs of the output:
      - You must grade all of the criteria
      - You must grade each criterion by reading the level description then give and choose the one that is the most appropriate for the input
      - The score must be exactly the same as the level's weight (or if it contains a max and min value, then the graded score must be both: lower or equal to the max value; higher and *must not* equal to the min value. for example, if "weight": { "max": 100, "min":75 }, the score should be in range 75 < score <= 100).
      - If the score you gave:
        - is 100, you don't have to provide any detailed feedback in the \`feedback\` field, but at least provide the summary in the \`summary\` field
        - is less than 100, you **must** (except some cases) provide a detailed feedback in the \`feedback\` field, explaining why you gave that score and highlighting the part of the input that you based your decision on
  `;
}

export async function gradeCriteria(options: {
  partOfRubric: GradingCriterion[];
  prompt: string;
}): Promise<Result<CriterionGradingResult[], Error>> {
  logger.debug("Grading using LLM");

  const gradingSystemPrompt = createGradingSystemPrompt(options.partOfRubric);

  const responseResult = await ResultAsync.fromPromise(
    generateObject({
      ...llmOptions,
      output: "array",
      schema: criterionGradingResultSchema,
      system: gradingSystemPrompt,
      prompt: options.prompt,
    }),
    asError,
  );
  if (responseResult.isErr()) {
    return err(wrapError(responseResult.error, "Failed to grade"));
  }

  const gradingRes = responseResult.value.object;

  return ok(gradingRes);
}

export async function gradeSubmission(data: GradingCriterionData[]) {
  const packResult = await packSubmission(
    data.map(({ criterion, fileRefs }) => ({ criterion, fileRefs })),
  );

  if (packResult.isErr()) {
    return err(
      wrapError(packResult.error, "Failed to pack submission files for grading"),
    );
  }

  const packData = packResult.value;

  const ListOfRubricPart = packData.okList.map((item) => {
    return item.criteria.map((criterion) => data.find((d) => d.criterion === criterion)!);
  });

  const gradingResults = await Promise.all(
    ListOfRubricPart.map((item, idx) => {
      return gradeCriteria({
        partOfRubric: item,
        prompt: packData.okList[idx].content,
      });
    }),
  );

  const okResults: CriterionGradingResult[] = [];
  const errorResults = packData.errorList.flatMap((item) => {
    return item.criteria.map((criterion) => ({
      criterion,
      error: [item.error],
    }));
  });

  gradingResults.forEach((result, idx) => {
    if (result.isErr()) {
      ListOfRubricPart[idx].forEach((item) => {
        errorResults.push({
          criterion: item.criterion,
          error: [result.error.message],
        });
      });

      return;
    }

    return okResults.push(...result.value);
  });

  const response = [...okResults, ...errorResults];

  return ok(response);
}
