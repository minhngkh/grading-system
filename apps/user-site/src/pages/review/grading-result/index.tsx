import { useEffect, useState } from "react";
import { GradingAttempt } from "@/types/grading";
import { Assessment } from "@/types/assessment";
import SummarySection from "./summary-section";
import ReviewResults from "./review-results";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AssessmentService } from "@/services/assessment-service";

type ResultsStepProps = {
  gradingAttempt: GradingAttempt;
};

export default function GradingResult({ gradingAttempt }: ResultsStepProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      const assessments = await AssessmentService.getGradingAssessments(
        gradingAttempt.id,
      );
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
    <div className="space-y-6">
      <div className="flex">
        <div className="flex items-center gap-2 p-2 border rounded-lg shadow-sm">
          <p className="ms-1 text-sm font-semibold">Actions: </p>
          <Button size="sm" disabled={isLoading}>
            Change Scale Factor
          </Button>
          <Button size="sm" disabled={isLoading}>
            View Rubric
          </Button>
          <Button size="sm" disabled={isLoading}>
            Regrade All
          </Button>
        </div>
      </div>
      <SummarySection isLoading={isLoading} assessments={assessments} />
      <ReviewResults isLoading={isLoading} assessments={assessments} />
    </div>
  );
}
