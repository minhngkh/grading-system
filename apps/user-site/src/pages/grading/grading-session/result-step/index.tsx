import { useEffect, useState } from "react";
import { GradingAttempt } from "@/types/grading";
import { Assessment } from "@/types/assessment";
import SummarySection from "./summary-section";
import ReviewResults from "./review-results";
import { getGradingAssessments } from "@/services/grading-service";
import { toast } from "sonner";

type ResultsStepProps = {
  gradingAttempt: GradingAttempt;
};

export default function ResultsStep({ gradingAttempt }: ResultsStepProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      const assessments = await getGradingAssessments(gradingAttempt.id);
      setAssessments(assessments);
    } catch (error) {
      toast.error("Failed to fetch assessments");
      console.error("Error fetching assessments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  return (
    <div className="space-y-8">
      <SummarySection isLoading={isLoading} assessments={assessments} />
      <ReviewResults isLoading={isLoading} assessments={assessments} />
    </div>
  );
}
