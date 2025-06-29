import { lazy, Suspense, useRef } from "react";
import { useEffect, useState } from "react";
import { GradingAttempt } from "@/types/grading";
import { Assessment, AssessmentState } from "@/types/assessment";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { SignalRService } from "@/services/realtime-service";
import { AssessmentGradingStatus } from "@/types/grading-progress";
import { useMutation, useQuery } from "@tanstack/react-query";
import { rerunGradingMutationOptions } from "@/queries/grading-queries";
import { getAllGradingAssessmentsQueryOptions } from "@/queries/assessment-queries";
import PendingComponent from "@/components/app/route-pending";

const SummarySection = lazy(() => import("./summary-section"));
const ReviewResults = lazy(() => import("./review-results"));

interface GradingResultProps {
  gradingAttempt: GradingAttempt;
}

export default function GradingResult({ gradingAttempt }: GradingResultProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [scaleFactor, setScaleFactor] = useState(gradingAttempt.scaleFactor ?? 10);
  const [viewRubricOpen, setViewRubricOpen] = useState(false);
  const [changeScaleFactorOpen, setChangeScaleFactorOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const auth = useAuth();
  const hubRef = useRef<SignalRService>();
  const [isRerunning, setIsRerunning] = useState(false);

  // invalidate assessments query after rerunning grading
  const { data: assessmentsData, isLoading } = useQuery(
    getAllGradingAssessmentsQueryOptions(gradingAttempt.id, auth),
  );

  const { mutateAsync: rerunGrading } = useMutation(
    rerunGradingMutationOptions(gradingAttempt.id, auth),
  );

  const handleStatusChange = (newStatus: AssessmentGradingStatus) => {
    setAssessments((prev) => {
      return prev.map((item) => {
        if (item.id === newStatus.assessmentId) {
          return {
            ...item,
            status: newStatus.status,
          };
        }

        return item;
      });
    });
  };

  const handleRegister = (initialStatus: AssessmentGradingStatus[]) => {
    const updatedAssessments =
      assessmentsData?.map((assessment) => {
        const status = initialStatus.find((s) => s.assessmentId === assessment.id);

        if (!status) return assessment;

        return {
          ...assessment,
          status: status.status,
        };
      }) || [];

    setAssessments(updatedAssessments);
  };

  useEffect(() => {
    if (isLoading || hubRef.current) return;

    (async () => {
      const token = await auth.getToken();
      if (!token) return;

      try {
        const hub = new SignalRService(() => token);
        hub.on("ReceiveAssessmentProgress", (assessmentStatus) =>
          handleStatusChange(assessmentStatus),
        );
        hub.on("Complete", () => setIsRerunning(false));

        await hub.start();
        hubRef.current = hub;

        const initialState = await hub.invoke("Register", gradingAttempt.id);
        handleRegister(initialState);
      } catch (error) {
        console.error("Error starting SignalR hub:", error);
        toast.error("Failed to regrade assessments. Please try again later.");
      }
    })();

    return () => {
      if (hubRef.current) {
        hubRef.current.off("ReceiveAssessmentProgress");
        hubRef.current.off("Complete");
        hubRef.current.stop();
      }
    };
  }, [isLoading]);

  const handleRegradeAll = async () => {
    try {
      await rerunGrading();
      setIsRerunning(true);
    } catch (error) {
      console.error("Error regrading all assessments:", error);
      toast.error("Failed to regrade all assessments. Please try again later.");
    }
  };

  const sortedAssessments = [...assessments].sort((a, b) => {
    const aIsFailed = a.status === AssessmentState.AutoGradingFailed;
    const bIsFailed = b.status === AssessmentState.AutoGradingFailed;
    if (aIsFailed && !bIsFailed) return -1;
    if (!aIsFailed && bIsFailed) return 1;
    return 0;
  });

  if (isLoading || isRerunning) {
    return <PendingComponent message="Loading assessments..." />;
  }

  return (
    <div className="space-y-6">
      <section className="flex">
        <div className="flex items-center gap-2 p-2 border rounded-lg shadow-sm">
          <p className="ms-1 text-sm font-semibold">Actions: </p>
          <Button variant="outline" size="sm" onClick={() => setViewRubricOpen(true)}>
            <Eye className="w-4 h-4" />
            View Rubric
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || isRerunning}
            onClick={() => setChangeScaleFactorOpen(true)}
          >
            <Scale className="w-4 h-4" />
            Change Grade Scale
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || isRerunning}
            onClick={() => setExportOpen(true)}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link
            to="/gradings/$gradingId/analytics"
            params={{ gradingId: gradingAttempt.id }}
          >
            <Button size="sm" variant="outline" disabled={isLoading || isRerunning}>
              <ChartColumn className="w-4 h-4" />
              View Analytics
            </Button>
          </Link>
          <Button
            size="sm"
            disabled={isLoading || isRerunning}
            onClick={handleRegradeAll}
          >
            <RefreshCw className="w-4 h-4" />
            Regrade All
          </Button>
        </div>
      </section>
      <Suspense fallback={<SummaryCardSkeleton />}>
        {<SummarySection assessments={sortedAssessments} scaleFactor={scaleFactor} />}
      </Suspense>

      <Suspense fallback={<ResultCardSkeleton />}>
        {<ReviewResults assessments={sortedAssessments} scaleFactor={scaleFactor} />}
      </Suspense>
      {viewRubricOpen && (
        <ViewRubricDialog
          open={viewRubricOpen}
          onOpenChange={setViewRubricOpen}
          rubricId={gradingAttempt.rubricId}
        />
      )}
      {changeScaleFactorOpen && (
        <ChangeScaleFactorDialog
          open={changeScaleFactorOpen}
          onOpenChange={setChangeScaleFactorOpen}
          initialScaleFactor={scaleFactor}
          onChangeScaleFactor={setScaleFactor}
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
