import { z } from "zod";

export enum RubricStatus {
  Draft = "Draft",
  Used = "Used",
}

export const LevelSchema = z.object({
  description: z.string(),
  weight: z
    .number()
    .min(0, "Level weight must be at least 0")
    .max(100, "Level weight cannot exceed 100"),
  tag: z.string().min(1, "Level performance tag is required"),
});

export const CriteriaSchema = z.object({
  name: z.string().min(1, "Criterion name is required"),
  weight: z
    .number()
    .min(1, "Criterion weight must be at least 1")
    .max(100, "Criterion weight cannot exceed 100")
    .optional(),
  levels: z
    .array(LevelSchema)
    .min(1, "At least one level is required for criterion")
    .max(6, "Maximum of 6 levels allowed per criterion")
    .refine(
      (level) => {
        const maxWeight = level.reduce(
          (max, lvl) => ((lvl.weight || 0) > max ? lvl.weight || 0 : max),
          0,
        );
        return maxWeight === 100;
      },
      {
        message: "Max weight of criterion levels must equal 100",
      },
    ),
  plugin: z.string().optional(),
  configuration: z.string().optional(),
});

export const RubricSchema = z
  .object({
    id: z.string(),
    rubricName: z.string().min(1, "Rubric name is required"),
    tags: z
      .array(z.string().min(1, "Level name is required"))
      .min(1, "At least one performance tag is required for the rubric")
      .max(6, "Maximum of 6 performance tags allowed for the rubric"),
    criteria: z
      .array(CriteriaSchema)
      .min(1, "At least one criterion is required for the rubric")
      .refine(
        (criterion) => {
          const totalWeight = criterion.reduce(
            (sum, crit) => sum + (crit.weight || 0),
            0,
          );
          return totalWeight === 100;
        },
        {
          message: "Total weight of rubric criteria must equal 100",
        },
      ),
    updatedOn: z.date().optional(),
    status: z.nativeEnum(RubricStatus).optional(),
    attachments: z
      .array(z.string().min(1, "Attachment name is required"))
      .optional()
      .nullable(),
    metadata: z.record(z.string()).optional().nullable(),
  })
  .refine(
    (data) => {
      return data.tags.every((tag) =>
        data.criteria.some((criterion) =>
          criterion.levels.some((level) => level.tag === tag),
        ),
      );
    },
    {
      message:
        "Each rubric level must have at least one criterion with a level using that tag",
    },
  );

export type Level = z.infer<typeof LevelSchema>;
export type Criteria = z.infer<typeof CriteriaSchema>;
export type Rubric = z.infer<typeof RubricSchema>;
