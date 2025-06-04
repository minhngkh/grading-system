import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import dedent from "dedent";
import z from "zod";

export function getText(path: string) {
  return readFileSync(getPath(path), "utf-8");
}

export function getFile(path: string) {
  return Buffer.from(readFileSync(getPath(path))).toString("base64");
}


export function createSystemPrompt(rubric: Record<string, any>, additionalInstructions: string = ""): string {
  return dedent`
    ### System prompt - ID: ${randomUUID()}
    - You are a helpful AI assistant that grades the input using the provided rubric bellow
    ${additionalInstructions}

    ### Rubric used for grading
    - The exact rubric that you should use for grading:
    \`\`\`json
    ${JSON.stringify(rubric, null, 2)}
    \`\`\`


    ### Instructions
    - Here are some more detailed specs of the output:
      - You must grade all of the criteria
      - You must grade each criterion by reading the level description then give and choose the one that is the most appropriate for the input
      - The score must be exactly the same as the level's weight (or if it contains a max and min value, then the graded score must be both: lower or equal to the max value; higher and *must not* equal to the min value. for example, if "weight": { "max": 100, "min":75 }, the score should be in range 75 < score <= 100).
      - If the score you gave:
        - is 100, you don't have to provide any detailed feedback in the \`feedback\` field, but at least provide the summary in the \`summary\` field
        - is less than 100, you **must** (except some cases) provide a detailed feedback in the \`feedback\` field, explaining why you gave that score and highlighting the part of the input that you based your decision on
  `;
}

export function getPath(name: string) {
  return path.join(process.cwd(), "data", name);
}

export const rubricSchema = z.object({
  rubricName: z
    .string()
    .optional()
    .describe("name of the rubric, should not be empty in most cases"),
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
              .describe("tag of the level, must be one of the rubric's performance tags"),
            weight: z
              .object({
                max: z.number().int().describe("maximum value, can be equal"),
                min: z.number().int().describe("minimum value, must not be equal"),
              })
              .describe(
                "When grading this rubric, if the criterion met the level's description, the score should be lower or equal to the criterion's max weight and higher than the min weight",
              ),
            description: z.string(),
          }),
        )
        .describe("levels of the criterion"),
    }),
  ),
});

export type Rubric = z.infer<typeof rubricSchema>;

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

export const resultSchema = z.object({
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