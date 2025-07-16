import { Submission } from "@/types/grading";

export const getSubmissionName = (submission: Submission) => {
  return submission.reference || "Unknown File";
};
