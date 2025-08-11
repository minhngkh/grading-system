import { Rubric, RubricSchema } from "@/types/rubric";

export enum RubricValidationState {
  VALID,
  VALUE_ERROR,
  PLUGIN_ERROR,
}

export type RubricValidationResult = {
  state: RubricValidationState;
  message?: string;
};

export const validateRubric = (rubric: Rubric): RubricValidationResult => {
  const formState = RubricSchema.safeParse(rubric);
  if (!formState.success) {
    return {
      state: RubricValidationState.VALUE_ERROR,
      message: "Rubric is invalid.",
    };
  }

  for (const criterion of rubric.criteria) {
    if (criterion.plugin && criterion.plugin !== "None") {
      if (!criterion.configuration || criterion.configuration.trim().length === 0) {
        return {
          state: RubricValidationState.PLUGIN_ERROR,
          message: `Plugin ${criterion.plugin} is not configured properly.`,
        };
      }
    }
  }

  return { state: RubricValidationState.VALID };
};
