import { lazy, Suspense } from "react";
import { useEffect, useState } from "react";
import { GradingAttempt } from "@/types/grading";
import { Assessment } from "@/types/assessment";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AssessmentService } from "@/services/assessment-service";
import { ViewRubricDialog } from "@/components/app/view-rubric-dialog";
import { ChangeScaleFactorDialog } from "@/components/app/edit-scale-factor-dialog";
import { ExportDialog } from "@/components/app/export-dialog";
import { GradingExporter } from "@/lib/exporters";
import { Eye, Scale, Download, RefreshCw, ChartColumn } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";
import {
  ResultCardSkeleton,
  SummaryCardSkeleton,
} from "@/pages/grading/grading-result/skeletons";

const SummarySection = lazy(() => import("./summary-section"));
const ReviewResults = lazy(() => import("./review-results"));

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
  const auth = useAuth();

  useEffect(() => {
    const fetchAssessments = async () => {
      const token = await auth.getToken();
      if (!token) return toast.error("Unauthorized: No token found");

      try {
        setIsLoading(true);
        const assessmentsData = await AssessmentService.getAllGradingAssessments(
          gradingAttempt.id,
          token,
        );
        setAssessments([...assessments, ...assessmentsData]);
      } catch (error) {
        toast.error("Failed to fetch assessments");
        console.error("Error fetching assessments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoading) fetchAssessments();
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
            <Eye className="w-4 h-4" />
            View Rubric
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => setChangeScaleFactorOpen(true)}
          >
            <Scale className="w-4 h-4" />
            Change Grade Scale
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => setExportOpen(true)}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link
            to="/gradings/$gradingId/analytics"
            params={{ gradingId: gradingAttempt.id }}
          >
            <Button size="sm" variant="outline" disabled={isLoading}>
              <ChartColumn className="w-4 h-4" />
              View Analytics
            </Button>
          </Link>
          <Button size="sm" disabled={isLoading}>
            <RefreshCw className="w-4 h-4" />
            Regrade All
          </Button>
        </div>
      </section>
      <Suspense fallback={<SummaryCardSkeleton />}>
        {isLoading ?
          <SummaryCardSkeleton />
        : <SummarySection assessments={assessments} scaleFactor={scaleFactor} />}
      </Suspense>

      <Suspense fallback={<ResultCardSkeleton />}>
        {isLoading ?
          <ResultCardSkeleton />
        : <ReviewResults assessments={assessments} scaleFactor={scaleFactor} />}
      </Suspense>
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
