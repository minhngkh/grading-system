import { AssessmentState } from "@/types/assessment";

export type AssessmentGradingStatus = {
  id: string;
  submissionReference: string;
  status: AssessmentState;
  errorMessage?: string;
};
