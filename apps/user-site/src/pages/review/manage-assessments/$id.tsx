import { useEffect, useState } from "react";
import { GradingAttempt } from "@/types/grading";
import ResultsStep from "@/pages/grading/grading-session/result-step";

type ManageAssessmentsPageProps = {
  gradingAttempt: GradingAttempt;
};

export default function ManageAssessmentsPage({
  gradingAttempt,
}: ManageAssessmentsPageProps) {
  return <ResultsStep gradingAttempt={gradingAttempt} />;
}
