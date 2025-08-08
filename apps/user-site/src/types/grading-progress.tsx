import { AssessmentState } from "@/types/assessment";

export type AssessmentGradingStatus = {
  assessmentId: string;
  submissionReference: string;
  status: AssessmentState;
  errorMessage?: string;
};
