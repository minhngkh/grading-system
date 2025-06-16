import z from "zod";

export type ServiceEvent = {
  name: string;
  schema: z.ZodObject<any, any, any>;
};

export const submissionStartedEvent: ServiceEvent = {
  name: "grading.submission.started",
  schema: z.object({
    assessmentId: z.string(),
    criteria: z.array(
      z.object({
        criterionName: z.string(),
        fileRefs: z.array(z.string()),
        levels: z.array(
          z.object({
            tag: z.string(),
            description: z.string(),
            weight: z.coerce.number().int().min(0).max(100),
          }),
        ),
        plugin: z.string(),
        configuration: z.string(),
      }),
    ),
  }),
};

export const submissionGradedEvent: ServiceEvent = {
  name: "grading.submission.graded",
  schema: z.object({
    assessmentId: z.string(),
    scoreBreakdown: z
      .array(
        z.object({
          criterionName: z.string(),
          tag: z.string(),
          rawScore: z.number().int().min(0).max(100),
          feedbackItems: z.array(
            z.object({
              comment: z.string(),
              fileRef: z.string(),
              tag: z.string(),
              fromCol: z.number().int(),
              toCol: z.number().int(),
              fromLine: z.number().int(),
              toLine: z.number().int(),
            }),
          ),
        }),
      )
      .optional(),
    errors: z.array(z.string()).optional(),
  }),
};
