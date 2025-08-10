import type { FilePart } from "ai";
import type { LanguageModelWithOptions } from "@/core/llm/types";
import type { Criterion, CriterionData } from "@/plugins/data";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { EmptyListError } from "@grading-system/plugin-shared/lib/error";
import {
  getBlobNameParts,
  getBlobNameRest,
} from "@grading-system/utils/azure-storage-blob";
import { asError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { generateObject } from "ai";
import { errAsync, fromPromise, okAsync, Result, ResultAsync, safeTry } from "neverthrow";
import z from "zod";
import { googleProviderOptions } from "@/core/llm/providers/google";
import { registry } from "@/core/llm/registry";
import { createFileAliasManifest, createLlmFileParts } from "@/plugins/ai/media-files";
import { gradingSystemPrompt } from "@/plugins/ai/prompts/grade";
import { packFilesSubsets } from "@/plugins/ai/repomix";
import { generateRubricContext } from "@/plugins/ai/rubric-metadata";
import { feedbackSchema } from "@/plugins/data";
import { ErrorWithCriteriaInfo } from "@/plugins/error";

const llmOptions: LanguageModelWithOptions = {
  model: registry.languageModel("google:gemini-2.5-flash"),
  providerOptions: googleProviderOptions["gemini-2.5-flash"]({
    thinking: {
      mode: "disabled",
    },
  }),
};

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

function createGradingSystemPrompt(partOfRubric: Criterion[]) {
  return gradingSystemPrompt(JSON.stringify(partOfRubric, null, 2));
}

export function gradeCriteria(options: {
  partOfRubric: Criterion[];
  prompt: string;
  fileParts: FilePart[];
  header?: string;
  footer?: string;
}) {
  const systemPrompt = createGradingSystemPrompt(options.partOfRubric);
  const prompt = `${options.header || ""}\n${options.prompt}\n${options.footer || ""}`;

  if (process.env.NODE_ENV === "development") {
    const tmpDir = path.join(process.cwd(), "tmp");

    fromPromise(access(tmpDir), asError).orElse(() =>
      fromPromise(mkdir(tmpDir), () => {
        logger.debug("Failed to create tmp directory for grading system prompt");
      }),
    );

    fromPromise(
      writeFile(path.join(tmpDir, "grading-system-prompt.txt"), systemPrompt, "utf-8"),
      () => {
        logger.debug("Failed to write grading system prompt to file");
      },
    );

    fromPromise(
      writeFile(path.join(tmpDir, "grading-prompt.txt"), prompt, "utf-8"),
      () => {
        logger.debug("Failed to write grading prompt to file");
      },
    );
  }

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
        cause: error,
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
      return errAsync(new EmptyListError({ message: "No criteria to grade" }));
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
      return errAsync(new EmptyListError({ message: "No file to grade" }));
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
              cause: error,
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
                  cause: error,
                }),
            )
            .andThen((mediaValue) =>
              createFileAliasManifest(mediaValue.BlobNameRestAliasMap)
                .mapErr(
                  (error) =>
                    new ErrorWithCriteriaInfo({
                      data: { criterionNames: value.criterionNames },
                      message: `Failed to create manifest info for media files`,
                      cause: error,
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
                cause: error,
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
