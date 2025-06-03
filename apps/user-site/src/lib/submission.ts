import { Submission } from "@/types/grading";

export const getSubmissionName = (submission: Submission) => {
  return submission.reference.split("_").pop() || "Unknown File";
};
