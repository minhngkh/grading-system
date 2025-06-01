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
import ExportDialog from "@/components/app/export-dialog";
import { GradingExporter } from "@/lib/exporters";

interface GradingResultProps {
  gradingAttempt: GradingAttempt;
}

export default function GradingResult({ gradingAttempt }: GradingResultProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(gradingAttempt.scaleFactor ?? 10);
  const [viewRubricOpen, setViewRubricOpen] = useState(false);
  const [changeScaleFactorOpen, setChangeScaleFactorOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const fetchAssessments = async () => {
      setIsLoading(true);
      try {
        const assessmentsData = await AssessmentService.getGradingAssessments(
          gradingAttempt.id,
        );

        setAssessments(assessmentsData);
      } catch (error) {
        toast.error("Failed to fetch assessments");
        console.error("Error fetching assessments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, [gradingAttempt.id]);

  return (
    <div className="space-y-6">
      <section className="flex">
        <div className="flex items-center gap-2 p-2 border rounded-lg shadow-sm">
          <p className="ms-1 text-sm font-semibold">Actions: </p>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => setViewRubricOpen(true)}
          >
            View Rubric
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => setChangeScaleFactorOpen(true)}
          >
            Change Scale Factor
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => setExportOpen(true)}
          >
            Export
          </Button>
          <Button variant="destructive" size="sm" disabled={isLoading}>
            Regrade All
          </Button>
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
      {viewRubricOpen && (
        <ViewRubricDialog
          open={viewRubricOpen}
          onOpenChange={setViewRubricOpen}
          rubricId={gradingAttempt.rubricId!}
        />
      )}
      {changeScaleFactorOpen && (
        <ChangeScaleFactorDialog
          open={changeScaleFactorOpen}
          onOpenChange={setChangeScaleFactorOpen}
          initialScaleFactor={scaleFactor}
          onChangeScaleFactor={(newScaleFactor) => setScaleFactor(() => newScaleFactor)}
        />
      )}
      {exportOpen && (
        <ExportDialog
          exporterClass={GradingExporter}
          args={[gradingAttempt, assessments]}
          open={exportOpen}
          onOpenChange={setExportOpen}
        />
      )}
    </div>
  );
}
