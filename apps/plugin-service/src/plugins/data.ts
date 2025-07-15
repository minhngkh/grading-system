import { ZodParams } from "moleculer-zod-validator";
import { z } from "zod";

const submissionSchema = z.object({
  assessmentId: z.string(),
  criterionDataList: z.array(
    z.object({
      criterionName: z.string(),
      levels: z.array(
        z.object({
          tag: z.string(),
          description: z.string(),
          weight: z.number(),
        }),
      ),
      fileRefs: z.array(z.string()),
      plugin: z.string(),
      configuration: z.string(),
    }),
  ),
  attachments: z.array(z.string()),
  metadata: z.record(z.unknown()),
});

export const gradeSubmissionActionParams = new ZodParams(submissionSchema.shape);

// export interface Criterion {
//   criterionName: string;
//   levels: {
//     tag: string;
//     description: string;
//     weight: number;
//   }[];
// }

export type CriterionData = z.infer<typeof submissionSchema>["criterionDataList"][number];

export type Criterion = Pick<CriterionData, "criterionName" | "levels">;

export const textLocationDataSchema = z
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

export const pdfLocationDataSchema = z
  .object({
    type: z.literal("pdf"),
    page: z.number().int(),
  })
  .describe(
    "Page of the PDF file to highlight the reason why you conclude to that comment",
  );

export const otherLocationDataSchema = z.object({
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

export type Feedback = z.infer<typeof feedbackSchema>;