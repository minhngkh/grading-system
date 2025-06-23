import { lazy, Suspense, useRef } from "react";
import { useEffect, useState } from "react";
import { GradingAttempt } from "@/types/grading";
import { Assessment, AssessmentState } from "@/types/assessment";
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
import { SignalRService } from "@/services/realtime-service";
import { AssessmentGradingStatus } from "@/types/grading-progress";
import { GradingService } from "@/services/grading-service";

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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const auth = useAuth();

  const hubRef = useRef<SignalRService | null>(null);

  const handleStatusChange = (isActive: boolean, newStatus: AssessmentGradingStatus) => {
    if (!isActive) return;

    setAssessments((prev) => {
      return prev.map((item) => {
        if (item.id === newStatus.id) {
          return {
            ...item,
            status: newStatus.status,
          };
        }

        return item;
      });
    });
  };

  const handleRegister = (
    isActive: boolean,
    initialStatus: AssessmentGradingStatus[],
  ) => {
    if (!isActive) return;

    const updatedAssessments = assessments.map((assessment) => {
      const status = initialStatus.find((s) => s.id === assessment.id);

      if (!status) return assessment;

      return {
        ...assessment,
        status: status.status,
      };
    });

    setAssessments(updatedAssessments);

    if (
      !initialStatus.some(
        (status) => status.status === AssessmentState.AutoGradingStarted,
      ) &&
      isLoading
    ) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchAssessments = async () => {
      const token = await auth.getToken();
      if (!token) return;

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
        setInitialLoadComplete(true);
      }
    };

    if (!isLoading) fetchAssessments();
  }, [gradingAttempt.id]);

  useEffect(() => {
    if (!initialLoadComplete) return;
    if (hubRef.current) return;

    let isActive = true;

    (async () => {
      const token = await auth.getToken();
      if (!token) return;

      try {
        const hub = new SignalRService(() => token);
        hub.on("ReceiveAssessmentProgress", (assessmentStatus) =>
          handleStatusChange(isActive, assessmentStatus),
        );
        hub.on("Complete", () => {
          console.log("Grading complete");
          setIsLoading(false);
        });

        await hub.start();
        hubRef.current = hub;

        const initialState = await hub.invoke("Register", gradingAttempt.id);
        handleRegister(isActive, initialState);
      } catch (error) {
        console.error("Error starting SignalR hub:", error);
        toast.error("Failed to regrade assessments. Please try again later.");
      }
    })();

    return () => {
      isActive = false;
      if (hubRef.current) {
        hubRef.current.off("ReceiveAssessmentProgress");
        hubRef.current.off("Complete");
        hubRef.current.stop();
      }
    };
  }, [initialLoadComplete]);

  const handleRegradeAll = async () => {
    try {
      const token = await auth.getToken();
      if (!token) {
        toast.error("You are not authorized to perform this action.");
        return;
      }

      setIsLoading(true);
      await GradingService.rerunGrading(gradingAttempt.id, token);
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
          <Button size="sm" disabled={isLoading} onClick={handleRegradeAll}>
            <RefreshCw className="w-4 h-4" />
            Regrade All
          </Button>
        </div>
      </section>
      <Suspense fallback={<SummaryCardSkeleton />}>
        {isLoading ?
          <SummaryCardSkeleton />
        : <SummarySection assessments={sortedAssessments} scaleFactor={scaleFactor} />}
      </Suspense>

      <Suspense fallback={<ResultCardSkeleton />}>
        {isLoading ?
          <ResultCardSkeleton />
        : <ReviewResults assessments={sortedAssessments} scaleFactor={scaleFactor} />}
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
