import { useEffect, useState } from "react";
import { GradingAttempt } from "@/types/grading";
import ResultsStep from "@/pages/grading/grading-session/result-step";
import axios from "axios";

type ManageAssessmentsPageProps = {
  gradingAttempt: GradingAttempt;
};

export default function ManageAssessmentsPage({
  gradingAttempt,
}: ManageAssessmentsPageProps) {
  return (
    <div>
      <ResultsStep gradingAttempt={gradingAttempt} /> <h2>File Content:</h2>
    </div>
  );
}
