import type { CustomErrorInfo } from "@grading-system/utils/error";
import type { FilePart } from "ai";
import type { LanguageModelWithOptions } from "@/core/llm/types";
import type { FilesSubset } from "@/plugins/ai/repomix";
import { getBlobName, getBlobNameParts } from "@grading-system/utils/azure-storage-blob";
import logger from "@grading-system/utils/logger";
import { generateObject } from "ai";
import dedent from "dedent";
import { err, ok, okAsync, ResultAsync, safeTry } from "neverthrow";
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

interface GradingCriterion {
  criterionName: string;
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
        - is less than 100, you should provide a detailed feedback in the \`feedback\` field, explaining why you gave that score and highlighting the part of the input that you based your decision on, if applicable
  `;
}

// export async function gradeCriteria0(options: {
//   partOfRubric: GradingCriterion[];
//   prompt: string;
// }): Promise<Result<CriterionGradingResult[], Error>> {
//   logger.debug("Grading using LLM");

//   const gradingSystemPrompt = createGradingSystemPrompt(options.partOfRubric);

//   const responseResult = await ResultAsync.fromPromise(
//     generateObject({
//       ...llmOptions,
//       output: "array",
//       schema: criterionGradingResultSchema,
//       system: gradingSystemPrompt,
//       prompt: options.prompt,
//     }),
//     asError,
//   );
//   if (responseResult.isErr()) {
//     return err(wrapError(responseResult.error, "Failed to grade"));
//   }

//   const gradingRes = responseResult.value.object;

//   return ok(gradingRes);
// }

// export async function gradeSubmission0(data: GradingCriterionData[]) {
//   const packResult = await packSubmission(
//     data.map(({ criterion, fileRefs }) => ({ criterion, fileRefs })),
//   );

//   if (packResult.isErr()) {
//     return err(
//       wrapError(packResult.error, "Failed to pack submission files for grading"),
//     );
//   }

//   const packData = packResult.value;

//   const ListOfRubricPart = packData.okList.map((item) => {
//     return item.criteria.map((criterion) => data.find((d) => d.criterion === criterion)!);
//   });

//   const gradingResults = await Promise.all(
//     ListOfRubricPart.map((item, idx) => {
//       return gradeCriteria({
//         partOfRubric: item,
//         prompt: packData.okList[idx].content,
//       });
//     }),
//   );

//   const okResults: CriterionGradingResult[] = [];
//   const errorResults = packData.errorList.flatMap((item) => {
//     return item.criteria.map((criterion) => ({
//       criterion,
//       error: [item.error],
//     }));
//   });

//   gradingResults.forEach((result, idx) => {
//     if (result.isErr()) {
//       ListOfRubricPart[idx].forEach((item) => {
//         errorResults.push({
//           criterion: item.criterion,
//           error: [result.error.message],
//         });
//       });

//       return;
//     }

//     return okResults.push(...result.value);
//   });

//   const response = [...okResults, ...errorResults];

//   return ok(response);
// }

class GradingError extends Error {
  criterionNames;
  constructor(info: CustomErrorInfo & { criterionNames: string[] }) {
    super(info.message, { cause: info.cause });
    this.criterionNames = info.criterionNames;
  }
}

export function gradeCriteria(options: {
  partOfRubric: GradingCriterion[];
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
      new GradingError({
        message: "Failed to grade criteria",
        cause: error,
        criterionNames: options.partOfRubric.map((c) => c.criterionName),
      }),
  ).map((response) => response.object);
}

type GradingResult =
  | { type: "success"; value: CriterionGradingResult }
  | {
      type: "failed";
      value: {
        criterionName: string;
        error: string;
      };
    };

export function gradeSubmission(data: GradingCriterionData[], id?: string) {
  return safeTry(async function* () {
    if (data.length === 0) {
      // return errAsync(new Error("No data provided for grading"));
    }

    const { root: sourceId } = yield* getBlobName(
      data[0].fileRefs[0],
      DEFAULT_CONTAINER,
    ).map((name) => getBlobNameParts(name));

    const filesGroups: FilesSubset[] = data.map((item) => ({
      id: item.criterionName,
      blobUrls: item.fileRefs,
    }));

    const result: GradingResult[] = [];

    const withTextInfo = yield* packFilesSubsets(sourceId, filesGroups, id).map(
      (packResult) => {
        const success = [];
        for (const [idx, value] of packResult.entries()) {
          if (value.success) {
            success.push({
              criterionNames: value.ids,
              allBlobUrls: value.allBlobUrls,
              textBlobs: {
                packedContent: value.packedContent,
                totalTokens: value.totalTokens,
                usedBlobUrls: value.usedBlobUrls,
              },
            });
          } else {
            value.ids.forEach((id) => {
              result.push({
                type: "failed",
                value: {
                  criterionName: id,
                  error: value.error,
                },
              });
            });
          }
        }

        return success;
      },
    );

    const withMediaInfoRequests = [];

    for (const info of withTextInfo) {
      const otherBlobUrls = info.allBlobUrls.filter(
        (url) => !info.textBlobs.usedBlobUrls.has(url),
      );

      const request = createMediaFileParts(otherBlobUrls)
        .andThen((mediaInfo) => {
          const manifestInfo = createFileAliasManifest(mediaInfo.urlAliasMap);
          if (manifestInfo.isErr()) {
            return err(manifestInfo.error);
          }

          return ok({
            ...info,
            mediaBlobs: {
              llmMessageParts: mediaInfo.parts,
              ignoredUrls: mediaInfo.ignoredUrls,
              manifestInfo: manifestInfo.value,
            },
          });
        })
        .mapErr((error) => {
          info.criterionNames.forEach((name) => {
            logger.error("Failed to process non-text files for criterion", {
              criterionName: name,
              error: error.message,
            });
            result.push({
              type: "failed",
              value: {
                criterionName: name,
                error: "Failed to process non-text files",
              },
            });
          });
        });

      withMediaInfoRequests.push(request);
    }

    const withMediaInfo = await Promise.all(withMediaInfoRequests);

    const finalInfo = withMediaInfo
      .filter((item) => item.isOk())
      .map((item) => item.value);

    const gradeRequests = finalInfo.map((info) => {
      const criteria = info.criterionNames.map((name) => {
        return data.find((d) => d.criterionName === name)!;
      });

      return gradeCriteria({
        partOfRubric: criteria,
        prompt: info.textBlobs.packedContent,
        fileParts: info.mediaBlobs.llmMessageParts,
        fileAliasManifest: info.mediaBlobs.manifestInfo,
      });
    });

    const gradingResults = await Promise.all(gradeRequests);

    result.push(
      ...gradingResults.flatMap((result) => {
        if (result.isErr()) {
          return result.error.criterionNames.map((name): GradingResult => {
            return {
              type: "failed",
              value: {
                criterionName: name,
                error: result.error.message,
              },
            };
          });
        }

        return result.value.map(
          (item): GradingResult => ({
            type: "success",
            value: item,
          }),
        );
      }),
    );

    return okAsync(result);
  });
}
