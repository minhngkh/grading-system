import type { FilePart } from "ai";
import type { LanguageModelWithOptions } from "@/core/llm/types";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  getBlobNameParts,
  getBlobNameRest,
} from "@grading-system/utils/azure-storage-blob";
import { CustomError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { generateObject } from "ai";
import dedent from "dedent";
import { errAsync, fromPromise, okAsync, Result, ResultAsync, safeTry } from "neverthrow";
import z from "zod";
import { googleProviderOptions } from "@/core/llm/providers/google";
import { registry } from "@/core/llm/registry";
import { EmptyListError } from "@/lib/error";
import { createFileAliasManifest, createLlmFileParts } from "@/plugins/ai/media-files";
import { packFilesSubsets } from "@/plugins/ai/repomix";
import { generateRubricContext } from "@/plugins/ai/rubric-metadata";

const llmOptions: LanguageModelWithOptions = {
  model: registry.languageModel("google:gemini-2.5-flash-preview"),
  providerOptions: googleProviderOptions["gemini-2.5-flash-preview"]({
    thinking: {
      mode: "disabled",
    },
  }),
};

const textLocationDataSchema = z
  .object({
    type: z.literal("text"),
    fromLine: z.number().int(),
    fromColumn: z.number().int().optional(),
    toLine: z.number().int(),
    toColumn: z.number().int().optional(),
  })
  .describe(
    "Position of part of the files to highlight the reason why you conclude to that comment, this is relative to the file itself",
  );

const testLocationDataSchema = z.object({
  type: z.literal("test"),
  input: z.string(),
  expectedOutput: z.string(),
  actualOutput: z.string(),
});

const pdfLocationDataSchema = z
  .object({
    type: z.literal("pdf"),
    page: z.number().int(),
  })
  .describe(
    "Page of the PDF file to highlight the reason why you conclude to that comment",
  );

const otherLocationDataSchema = z.object({
  type: z.literal("other"),
});

export const feedbackSchema = z.object({
  comment: z.string().describe("short comment about the reason"),
  fileRef: z.string().describe("The file that the comment refers to"),
  locationData: z.discriminatedUnion("type", [
    textLocationDataSchema,
    pdfLocationDataSchema,
    otherLocationDataSchema,
  ]),
});

export const criterionGradingResultSchema = z.object({
  criterion: z
    .string()
    .describe(
      "name of the criterion that is graded, must be the name of one of the rubric's criteria",
    ),
  tag: z.string().describe("tag of the level that the score reached"),
  score: z.number().int().describe("score of the criterion"),
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

// - The score must be exactly the same as the level's weight (or if it contains a max and min value, then the graded score must be both: lower or equal to the max value; higher and *must not* equal to the min value. for example, if "weight": { "max": 100, "min":75 }, the score should be in range 75 < score <= 100).

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
      - You must grade each criterion by reading each level description then choose the level (its tag) that satisfies it based on the input
        - Note that if you feels like the input to grade is so bad it doesn't satisfy even the lowest level (and the lowest level is greater than 0), you must give it an empty \`tag\` and \`score\` of 0
      - After selecting the level, you must provide the score in the range from "the current level's weight" to less than (not equal to) "the next higher level's weight. If it is the highest level, then the score must be equal to the level's weight
        - For example, you choose level with tag "1" that have weight 50, and the next level is "2" with weight 75, then the score must be in range 50 < score <= 75
        - If you choose the highest level with tag "5" that have weight 100, then the score must be exactly 100
      - If the score you gave:
        - is 100, you don't have to provide any detailed feedback in the \`feedback\` field, but at least provide the summary in the \`summary\` field
        - is less than 100, you should provide a detailed feedback in the \`feedback\` field, explaining why you gave that score and highlighting the part of the file that you based your decision on on \`locationData\`, and on which file, if applicable
          - Note that the \`fileRef\` must be the original file path if you are referring to uploaded files that you can get by using the multimodal file manifest below (if present)
          - Text file output by repomix have the line number included at the start of each line, so use that to highlight correctly if your feedback is for a text file
          - Use the correct \`locationData\` type based on the file type, if it is a text file provided by repomix output, then use \`text\` type. If it is a multimodal uploaded file (should be listed in the manifest below if any), check the extension, then use \`pdf\` type if it is a PDF file, or \`other\` type if it is any other file type. Don't use \`text\` type for multimodal files
  `;
}

class ErrorWithCriteriaInfo extends CustomError<{
  criterionNames: string[];
}> {}

export function gradeCriteria(options: {
  partOfRubric: Criterion[];
  prompt: string;
  fileParts: FilePart[];
  header?: string;
  footer?: string;
}) {
  const systemPrompt = createGradingSystemPrompt(options.partOfRubric);
  const prompt = `${options.header || ""}\n${options.prompt}\n${options.footer || ""}`;

  fromPromise(mkdir(path.join(process.cwd(), "tmp")), () => {
    logger.debug("Failed to create tmp directory for grading system prompt");
  });

  fromPromise(
    writeFile(
      path.join(process.cwd(), "tmp/grading-system-prompt.txt"),
      systemPrompt,
      "utf-8",
    ),
    () => {
      logger.debug("Failed to write grading system prompt to file");
    },
  );

  fromPromise(
    writeFile(path.join(process.cwd(), "tmp/grading-prompt.txt"), prompt, "utf-8"),
    () => {
      logger.debug("Failed to write grading prompt to file");
    },
  );

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
              text: prompt,
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

export function gradeSubmission(data: {
  attachments: string[];
  metadata: Record<string, unknown>;
  criterionDataList: CriterionData[];
  attemptId?: string;
}) {
  return safeTry(async function* () {
    if (data.criterionDataList.length === 0) {
      return errAsync(
        new EmptyListError({
          message: "No criteria to grade",
          data: undefined,
        }),
      );
    }

    let firstFileRef;
    for (const critData of data.criterionDataList) {
      if (critData.fileRefs.length === 0) {
        continue;
      }
      firstFileRef = critData.fileRefs[0];
      break;
    }

    if (firstFileRef === undefined) {
      return errAsync(
        new EmptyListError({
          message: "No file to grade",
          data: undefined,
        }),
      );
    }

    const rubricContext = yield* generateRubricContext({
      blobNameList: data.attachments,
      metadata: data.metadata,
    });

    // TODO: change This
    // const sourceId = yield* getBlobNameParts(
    //   data.criterionDataList[0].fileRefs[0],
    // ).map((name) => {
    //   const { root, rest } = getBlobNameParts(name);
    //   const { root: dir } = getBlobNameParts(rest);
    //   return `${root}-${dir}`;
    // });

    const { root: gradingRef, rest } = getBlobNameParts(firstFileRef);
    const { root: submissionRef } = getBlobNameParts(rest);
    const sourceId = `${gradingRef}-${submissionRef}`;
    const blobNameRoot = `${gradingRef}/${submissionRef}`;

    const criterionFilesPromises = data.criterionDataList.map((item) => {
      return Result.combine(
        item.fileRefs.map((blobName) => getBlobNameRest(blobName, blobNameRoot)),
      ).map((blobNameRestList) => {
        return {
          id: item.criterionName,
          blobNameRestList,
        };
      });
    });

    const criterionFiles = yield* Result.combine(criterionFilesPromises);

    const withTextResultList = yield* packFilesSubsets(
      sourceId,
      blobNameRoot,
      criterionFiles,
      data.attemptId,
    );

    const withMediaResultList = withTextResultList.map((packResult) =>
      packResult
        .map((packValue) => ({
          criterionNames: packValue.ids,
          downloadDir: packValue.downloadDir,
          textData: packValue.data,
        }))
        .mapErr(
          (error) =>
            new ErrorWithCriteriaInfo({
              data: { criterionNames: error.data.ids },
              message: `Failed to pack files for criteria`,
              options: { cause: error },
            }),
        )
        .andThen((value) => {
          const nonTextBlobs = [];
          for (const nameRest of value.textData.allBlobNameRests) {
            if (value.textData.usedBlobNameRests.has(nameRest)) {
              continue;
            }

            // const { rest: path } = getBlobNameParts(value.blobUrlNameMap.get(url)!);

            nonTextBlobs.push(nameRest);
          }

          return createLlmFileParts({
            blobNameRestList: nonTextBlobs,
            downloadDirectory: value.downloadDir,
            prefix: "file",
          })
            .mapErr(
              (error) =>
                new ErrorWithCriteriaInfo({
                  data: { criterionNames: value.criterionNames },
                  message: `Failed to process non-text files for criteria`,
                  options: { cause: error },
                }),
            )
            .andThen((mediaValue) =>
              createFileAliasManifest(mediaValue.BlobNameRestAliasMap)
                .mapErr(
                  (error) =>
                    new ErrorWithCriteriaInfo({
                      data: { criterionNames: value.criterionNames },
                      message: `Failed to create manifest info for media files`,
                      options: { cause: error },
                    }),
                )
                .map((manifest) => ({
                  ...value,
                  mediaData: {
                    llmMessageParts: mediaValue.llmFileParts,
                    ignoredNameRestList: mediaValue.ignoredBlobNameRestList,
                    manifestInfo: manifest,
                  },
                })),
            );
        }),
    );

    const gradeResultList = withMediaResultList.map((result) =>
      result.andThen((value) => {
        // Normal search instead of map since the number of criteria is usually small
        const criteriaData: Criterion[] = value.criterionNames.map((name) => {
          const obj = data.criterionDataList.find((c) => c.criterionName === name)!;
          return {
            criterionName: obj.criterionName,
            levels: obj.levels,
          };
        });

        logger.debug("files ignore", {
          ignoreUrls: value.mediaData.ignoredNameRestList,
        });
        return gradeCriteria({
          partOfRubric: criteriaData,
          prompt: value.textData.packedContent,
          fileParts: rubricContext.llmMessageParts.concat(
            value.mediaData.llmMessageParts,
          ),
          header: rubricContext.manifest,
          footer: value.mediaData.manifestInfo,
        })
          .mapErr(
            (error) =>
              new ErrorWithCriteriaInfo({
                data: { criterionNames: value.criterionNames },
                message: `Failed to grade criteria`,
                options: { cause: error },
              }),
          )
          .map((results) =>
            results.map((r) => ({
              ...r,
              feedback: r.feedback.map((fb) => ({
                ...fb,
                // FIXME: handle cases where fileRef is not in the blobNameRoot
                // fileRef: `${blobNameRoot}/${fb.fileRef}`,
                fileRef: `${submissionRef}/${fb.fileRef}`,
              })),
              ignoredFiles: value.mediaData.ignoredNameRestList.map(
                (nameRest) => `${submissionRef}/${nameRest}`,
              ),
            })),
          );
      }),
    );

    return okAsync(gradeResultList);
  });
}
