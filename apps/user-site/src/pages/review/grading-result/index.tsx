import { useEffect, useState } from "react";
import { GradingAttempt } from "@/types/grading";
import { Assessment } from "@/types/assessment";
import SummarySection from "./summary-section";
import ReviewResults from "./review-results";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AssessmentService } from "@/services/assessment-service";
import { ViewRubricDialog } from "@/components/app/view-rubric-dialog";
import { ChangeScaleFactorDialog } from "@/components/app/edit-scale-factor-dialog";

interface ResultsStepProps {
  gradingAttempt: GradingAttempt;
}

export default function GradingResult({ gradingAttempt }: ResultsStepProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(gradingAttempt.scaleFactor ?? 10);
  const [isChangeScaleFactorDialogOpen, setIsChangeScaleFactorDialogOpen] =
    useState(false);
  const [isViewRubricDialogOpen, setIsViewRubricDialogOpen] = useState(false);

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

  const handleChangeScaleFactor = async (newScaleFactor: number) => {
    setScaleFactor(newScaleFactor);
  };

  return (
    <div className="space-y-6">
      <section className="flex">
        <div className="flex items-center gap-2 p-2 border rounded-lg shadow-sm">
          <p className="ms-1 text-sm font-semibold">Actions: </p>
          <Button
            size="sm"
            disabled={isLoading}
            onClick={() => setIsViewRubricDialogOpen(true)}
          >
            View Rubric
          </Button>
          <Button size="sm" disabled={isLoading}>
            Regrade All
          </Button>
          <Button
            size="sm"
            disabled={isLoading}
            onClick={() => setIsChangeScaleFactorDialogOpen(true)}
          >
            Change Scale Factor
          </Button>
          <ChangeScaleFactorDialog
            initialScaleFactor={scaleFactor}
            onChangeScaleFactor={handleChangeScaleFactor}
            isOpen={isChangeScaleFactorDialogOpen}
            onOpenChange={setIsChangeScaleFactorDialogOpen}
          />
          <ViewRubricDialog
            rubricId={gradingAttempt.rubricId!}
            isOpen={isViewRubricDialogOpen}
            onOpenChange={setIsViewRubricDialogOpen}
          />
        </div>
      </section>
      <SummarySection
        isLoading={isLoading}
        assessments={assessments}
        scaleFactor={scaleFactor}
      />
      <ReviewResults
        isLoading={isLoading}
        assessments={assessments}
        scaleFactor={scaleFactor}
      />
    </div>
  );
}
