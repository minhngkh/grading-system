import { z } from "zod";

export enum GradingStatus {
  Extracting,
  Grading,
  Finished,
  Failed,
}

export const CriteriaMappingSchema = z.object({
  criteriaName: z.string({ required_error: "Criteria name is required" }),
  filePath: z
    .string({ required_error: "File path is required" })
    .min(1, { message: "File path cannot be empty" }),
});

export const GradingMappingSchema = z.object({
  rubricId: z.string({ required_error: "Rubric ID is required" }),
  files: z
    .array(z.instanceof(File), {
      invalid_type_error: "Files must be an array of File objects",
    })
    .min(0),
  criteriaMappings: z.array(CriteriaMappingSchema, {
    invalid_type_error: "Criteria mappings must be an array",
  }),
});

export const GradingAttemptSchema = z.object({
  fileName: z.string({ required_error: "File name is required" }),
  status: z.nativeEnum(GradingStatus, { invalid_type_error: "Invalid grading status" }),
});

export type CriteriaMapping = z.infer<typeof CriteriaMappingSchema>;
export type GradingMapping = z.infer<typeof GradingMappingSchema>;
export type GradingAttempt = z.infer<typeof GradingAttemptSchema>;
