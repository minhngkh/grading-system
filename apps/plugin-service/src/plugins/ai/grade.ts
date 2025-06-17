import type { FilePart } from "ai";
import type { LanguageModelWithOptions } from "@/core/llm/types";
import type { FilesSubset } from "@/plugins/ai/repomix";
import { getBlobName, getBlobNameParts } from "@grading-system/utils/azure-storage-blob";
import { CustomError } from "@grading-system/utils/error";
import { generateObject } from "ai";
import dedent from "dedent";
import { errAsync, okAsync, ResultAsync, safeTry } from "neverthrow";
import z from "zod";
import { googleProviderOptions } from "@/core/llm/providers/google";
import { registry } from "@/core/llm/registry";
import { DEFAULT_CONTAINER } from "@/lib/blob-storage";
import { createFileAliasManifest, createMediaFileParts } from "@/plugins/ai/media-files";
import { packFilesSubsets } from "@/plugins/ai/repomix";

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

interface Criterion {
  criterionName: string;
  levels: {
    tag: string;
    description: string;
    weight: number;
  }[];
}

interface CriterionData extends Criterion {
  fileRefs: string[];
  plugin: string;
  configuration: string;
}

function createGradingSystemPrompt(partOfRubric: Criterion[]) {
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
        - is less than 100, you should provide a detailed feedback in the \`feedback\` field, explaining why you gave that score and highlighting the part of the input that you based your decision on, if applicable
  `;
}

class ErrorWithCriteriaInfo extends CustomError<{
  criterionNames: string[];
}> {}

export function gradeCriteria(options: {
  partOfRubric: Criterion[];
  prompt: string;
  fileParts: FilePart[];
  fileAliasManifest: string;
}) {
  const baseSystemPrompt = createGradingSystemPrompt(options.partOfRubric);
  const systemPrompt = `${baseSystemPrompt}\n${options.fileAliasManifest}`;

  return ResultAsync.fromPromise(
    generateObject({
      ...llmOptions,
      output: "array",
      schema: criterionGradingResultSchema,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            ...options.fileParts,
            {
              type: "text",
              text: options.prompt,
            },
          ],
        },
      ],
    }),
    (error) =>
      new ErrorWithCriteriaInfo({
        data: {
          criterionNames: options.partOfRubric.map((c) => c.criterionName),
        },
        message: `Failed to grade criteria`,
        options: { cause: error },
      }),
  ).map((response) => response.object);
}

export function gradeSubmission(criterionDataList: CriterionData[], attemptId?: string) {
  return safeTry(async function* () {
    if (criterionDataList.length === 0) {
      return errAsync(new Error("No data provided for grading"));
    }

    const { root: blobRoot } = yield* getBlobName(
      criterionDataList[0].fileRefs[0],
      DEFAULT_CONTAINER,
    ).map((name) => getBlobNameParts(name));

    const criterionFiles = criterionDataList.map(
      (item): FilesSubset => ({
        id: item.criterionName,
        blobUrls: item.fileRefs,
      }),
    );

    const withTextResultList = yield* packFilesSubsets(
      blobRoot,
      criterionFiles,
      attemptId,
    );

    const withMediaResultList = withTextResultList.map((packResult) =>
      packResult
        .andThen((packValue) => {
          if (packValue.success) {
            return okAsync({
              criterionNames: packValue.ids,
              textData: packValue.data,
            });
          }

          return errAsync(
            new ErrorWithCriteriaInfo({
              data: { criterionNames: packValue.ids },
              message: packValue.error,
            }),
          );
        })
        .andThen((data) => {
          const nonTextBlobUrls = data.textData.allBlobUrls.filter(
            (url) => !data.textData.usedBlobUrls.has(url),
          );

          return createMediaFileParts(nonTextBlobUrls)
            .mapErr(
              (error) =>
                new ErrorWithCriteriaInfo({
                  data: { criterionNames: data.criterionNames },
                  message: `Failed to process non-text files for criteria`,
                  options: { cause: error },
                }),
            )
            .andThen((mediaData) =>
              createFileAliasManifest(mediaData.urlAliasMap)
                .mapErr(
                  (error) =>
                    new ErrorWithCriteriaInfo({
                      data: { criterionNames: data.criterionNames },
                      message: `Failed to create manifest info for media files`,
                      options: { cause: error },
                    }),
                )
                .map((manifest) => ({
                  ...data,
                  mediaData: {
                    llmMessageParts: mediaData.parts,
                    ignoredUrls: mediaData.ignoredUrls,
                    manifestInfo: manifest,
                  },
                })),
            );
        }),
    );

    const gradeResultList = withMediaResultList.map((result) =>
      result.andThen((data) => {
        // Normal search instead of map since the number of criteria is usually small
        const criteriaData = data.criterionNames.map(
          (name) => criterionDataList.find((c) => c.criterionName === name)!,
        );

        return gradeCriteria({
          partOfRubric: criteriaData,
          prompt: data.textData.packedContent,
          fileParts: data.mediaData.llmMessageParts,
          fileAliasManifest: data.mediaData.manifestInfo,
        }).mapErr(
          (error) =>
            new ErrorWithCriteriaInfo({
              data: { criterionNames: data.criterionNames },
              message: `Failed to grade criteria`,
              options: { cause: error },
            }),
        );
      }),
    );

    return okAsync(gradeResultList);
  });
}
