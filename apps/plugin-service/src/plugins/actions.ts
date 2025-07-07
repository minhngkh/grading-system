import { ZodParams } from "moleculer-zod-validator";
import { z } from "zod";

export const gradeSubmissionActionParams = new ZodParams({
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
