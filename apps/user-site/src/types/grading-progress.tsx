import { AssessmentState } from "@/types/assessment";

export type AssessmentGradingStatus = {
  id: string;
  name: string;
  status: AssessmentState;
  errorMessage?: string;
};
