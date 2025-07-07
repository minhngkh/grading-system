import { lazy, Suspense, useRef, useEffect, useState, useMemo, useCallback } from "react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  rerunGradingMutationOptions,
  updateGradingScaleFactorMutationOptions,
} from "@/queries/grading-queries";
import { getRubricQueryOptions } from "@/queries/rubric-queries";

const SummarySection = lazy(() => import("./summary-section"));
const ReviewResults = lazy(() => import("./review-results"));

interface GradingResultProps {
  gradingAttempt: GradingAttempt;
  assessmentsData: Assessment[];
}

export default function GradingResult({
  gradingAttempt,
  assessmentsData,
}: GradingResultProps) {
  const [assessments, setAssessments] = useState<AssessmentGradingStatus[]>([]);
  const [scaleFactor, setScaleFactor] = useState(gradingAttempt.scaleFactor ?? 10);
  const [viewRubricOpen, setViewRubricOpen] = useState(false);
  const [changeScaleFactorOpen, setChangeScaleFactorOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [isGrading, setIsGrading] = useState(false);

  const auth = useAuth();
  const queryClient = useQueryClient();
  const hubRef = useRef<SignalRService>();

  const { data: rubricData } = useQuery(
    getRubricQueryOptions(gradingAttempt.rubricId, auth, {
      staleTime: Infinity,
    }),
  );

  const { mutateAsync: rerunGrading } = useMutation(
    rerunGradingMutationOptions(gradingAttempt.id, auth),
  );

  const { mutateAsync: updateScaleFactor } = useMutation(
    updateGradingScaleFactorMutationOptions(gradingAttempt.id, auth),
  );

  const handleScaleFactorChange = useCallback(
    async (newScaleFactor: number) => {
      if (newScaleFactor === scaleFactor) return;

      try {
        await updateScaleFactor(newScaleFactor);
        setScaleFactor(newScaleFactor);
        toast.success("Grade scale factor updated successfully.");
      } catch (error) {
        console.error("Error updating scale factor:", error);
        toast.error("Failed to update grade scale factor. Please try again later.");
      }
    },
    [scaleFactor, updateScaleFactor],
  );

  const handleStatusChange = useCallback((newStatus: AssessmentGradingStatus) => {
    setAssessments((prev) => {
      const index = prev.findIndex((a) => a.assessmentId === newStatus.assessmentId);
      if (index === -1 || prev[index].status === newStatus.status) return prev;

      const updated = [...prev];
      updated[index] = { ...updated[index], status: newStatus.status };
      return updated;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const token = await auth.getToken();
      if (!token || !isMounted) return;

      try {
        const hub = new SignalRService(() => token);

        hub.on("ReceiveAssessmentProgress", handleStatusChange);
        hub.on("Complete", () => {
          queryClient.invalidateQueries({
            queryKey: ["allGradingAssessments", gradingAttempt.id],
          });

          queryClient.invalidateQueries({
            queryKey: ["gradingAttempt", gradingAttempt.id],
          });

          setIsGrading(false);
        });

        await hub.start();
        if (!isMounted) return;

        hubRef.current = hub;
        const initialState = await hub.invoke("Register", gradingAttempt.id);
        setAssessments(initialState);
      } catch (error) {
        console.error("Error starting SignalR hub:", error);
        toast.error("Failed to regrade assessments. Please try again later.");
      }
    })();

    return () => {
      isMounted = false;
      if (hubRef.current) {
        hubRef.current.off("ReceiveAssessmentProgress");
        hubRef.current.off("Complete");
        hubRef.current.stop();
        hubRef.current = undefined;
      }
    };
  }, []);

  const handleRegradeAll = useCallback(async () => {
    try {
      setIsGrading(true);

      queryClient.invalidateQueries({
        queryKey: ["gradingAttempt", gradingAttempt.id],
      });

      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "gradingAttempts";
        },
      });

      await rerunGrading();
    } catch (error) {
      setIsGrading(false);
      console.error("Error regrading all assessments:", error);
      toast.error("Failed to regrade all assessments. Please try again later.");
    }
  }, [rerunGrading]);

  const sortedAssessments = useMemo(() => {
    if (!assessmentsData) return [];

    return assessmentsData
      .map((assessment) => {
        const live = assessments.find((a) => a.assessmentId === assessment.id);
        return live ? { ...assessment, status: live.status } : assessment;
      })
      .sort((a, b) => {
        const aFailed = a.status === AssessmentState.AutoGradingFailed;
        const bFailed = b.status === AssessmentState.AutoGradingFailed;
        return (
          aFailed === bFailed ? 0
          : aFailed ? -1
          : 1
        );
      });
  }, [assessmentsData, assessments]);

  return (
    <div className="space-y-6">
      <section className="flex">
        <div className="flex items-center gap-2 p-2 border rounded-lg shadow-sm">
          <p className="ms-1 text-sm font-semibold">Actions:</p>
          <Button variant="outline" size="sm" onClick={() => setViewRubricOpen(true)}>
            <Eye className="w-4 h-4" />
            View Rubric
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isGrading}
            onClick={() => setChangeScaleFactorOpen(true)}
          >
            <Scale className="w-4 h-4" />
            Change Grade Scale
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isGrading}
            onClick={() => setExportOpen(true)}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link to="/analytics" search={{ id: gradingAttempt.id }}>
            <Button variant="outline" size="sm" disabled={isGrading}>
              <ChartColumn className="w-4 h-4" />
              View Analytics
            </Button>
          </Link>
          <Button size="sm" disabled={isGrading} onClick={handleRegradeAll}>
            <RefreshCw className="w-4 h-4" />
            Regrade All
          </Button>
        </div>
      </section>

      <Suspense fallback={<SummaryCardSkeleton />}>
        <SummarySection assessments={sortedAssessments} scaleFactor={scaleFactor} />
      </Suspense>

      <Suspense fallback={<ResultCardSkeleton />}>
        <ReviewResults assessments={sortedAssessments} scaleFactor={scaleFactor} />
      </Suspense>

      <ViewRubricDialog
        open={viewRubricOpen}
        onOpenChange={setViewRubricOpen}
        initialRubric={rubricData}
      />

      <ChangeScaleFactorDialog
        open={changeScaleFactorOpen}
        onOpenChange={setChangeScaleFactorOpen}
        initialScaleFactor={scaleFactor}
        onChangeScaleFactor={handleScaleFactorChange}
      />

      <ExportDialog
        exporterClass={GradingExporter}
        args={[gradingAttempt, sortedAssessments]}
        open={exportOpen}
        onOpenChange={setExportOpen}
      />
    </div>
  );
}
