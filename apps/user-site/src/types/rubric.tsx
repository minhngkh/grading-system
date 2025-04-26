import { z } from "zod";

export const LevelSchema = z.object({
  description: z.string(),
  weight: z.number().min(0, "Weight must be non-negative"),
  performanceTag: z.string().min(1, "Performance tag is required"),
});

export const CriteriaSchema = z.object({
  name: z.string().min(1, "Criterion name is required"),
  weight: z.number().min(0, "Weight must be non-negative").optional(),
  levels: z.array(LevelSchema).min(1, "At least one level is required for criterion"),
});

export const RubricSchema = z.object({
  id: z.string().optional(),
  rubricName: z.string().min(1, "Rubric name is required"),
  performanceTags: z
    .array(z.string().min(1, "Level name is required"))
    .min(1, "At least one performance tag is required"),
  criteria: z.array(CriteriaSchema).min(1, "At least one criterion is required"),
  updatedOn: z.date().optional(),
  status: z.string().optional(),
});

export type Level = z.infer<typeof LevelSchema>;
export type Criteria = z.infer<typeof CriteriaSchema>;
export type Rubric = z.infer<typeof RubricSchema>;
