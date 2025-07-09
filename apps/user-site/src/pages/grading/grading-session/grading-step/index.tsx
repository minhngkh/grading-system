import { GradingAttempt, GradingStatus } from "@/types/grading";
import { useEffect, useRef, useState } from "react";
import { SignalRService } from "@/services/realtime-service";
import { Spinner } from "@/components/app/spinner";
import { useAuth } from "@clerk/clerk-react";
import { AssessmentGradingStatus } from "@/types/grading-progress";
import { UseFormReturn } from "react-hook-form";
import { AssessmentStatusCard } from "@/pages/grading/grading-session/grading-step/status-card";
import { AssessmentState } from "@/types/assessment";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rerunAssessmentMutationOptions } from "@/queries/assessment-queries";
import { startGradingMutationOptions } from "@/queries/grading-queries";
import ErrorComponent from "@/components/app/route-error";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

interface GradingProgressStepProps {
  gradingAttempt: UseFormReturn<GradingAttempt>;
}

export default function GradingProgressStep({
  gradingAttempt,
}: GradingProgressStepProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const gradingAttemptValues = gradingAttempt.watch();
  const [assessmentStatus, setAssessmentStatus] = useState<
    AssessmentGradingStatus[] | null
  >(null);

  const queryClient = useQueryClient();

  const rerunAssessmentMutation = useMutation(rerunAssessmentMutationOptions(auth));
  const { mutateAsync: startGrading } = useMutation(
    startGradingMutationOptions(gradingAttemptValues.id, auth, {
      onError: (error) => {
        handleGradingStatusChange(GradingStatus.Failed);
        console.error("Failed to start grading:", error);
        toast.error("Failed to start grading. Please try again.");
      },
    }),
  );

  const handleGradingStatusChange = (newStatus: GradingStatus) => {
    gradingAttempt.setValue("status", newStatus);
    queryClient.invalidateQueries({
      queryKey: ["gradingAttempt", gradingAttemptValues.id],
    });
  };

  const handleStatusChange = (newStatus: AssessmentGradingStatus) => {
    setAssessmentStatus((prev) => {
      if (prev == null || prev.length === 0) return [newStatus];

      const exists = prev.some((item) => item.assessmentId === newStatus.assessmentId);
      if (!exists) {
        return [...prev, newStatus];
      }

      return prev.map((item) =>
        item.assessmentId === newStatus.assessmentId ? newStatus : item,
      );
    });
  };

  const handleRegister = (initialStatus: AssessmentGradingStatus[]) => {
    setAssessmentStatus(initialStatus);

    if (
      !initialStatus.some(
        (status) => status.status === AssessmentState.AutoGradingStarted,
      )
    ) {
      gradingAttempt.setValue("status", GradingStatus.Graded);
    }
  };

  const handleRegradeAssessment = async (assessmentId: string) => {
    try {
      await rerunAssessmentMutation.mutateAsync(assessmentId);
      handleGradingStatusChange(GradingStatus.Started);
      queryClient.invalidateQueries({
        queryKey: ["assessment", assessmentId],
      });
    } catch (error) {
      console.error("Failed to regrade assessment:", error);
      toast.error(`Failed to regrade assessment. Please try again.`);
    }
  };

  const hubRef = useRef<SignalRService | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const initGrading = async () => {
      if (hubRef.current || hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      const token = await auth.getToken();
      if (!token) return;

      try {
        const hub = new SignalRService(() => token);

        hub.on("ReceiveAssessmentProgress", (assessmentStatus) =>
          handleStatusChange(assessmentStatus),
        );
        hub.on("Complete", () => handleGradingStatusChange(GradingStatus.Graded));

        if (gradingAttemptValues.status === GradingStatus.Created) {
          await startGrading();
          handleGradingStatusChange(GradingStatus.Started);
        }

        await hub.start();
        hubRef.current = hub;

        const initialState = await hub.invoke("Register", gradingAttemptValues.id);
        handleRegister(initialState);
      } catch (error) {
        gradingAttempt.setValue("status", GradingStatus.Failed);
        console.error("Failed to start grading:", error);
        toast.error("Failed to start grading. Please try again.");
      }
    };

    initGrading();

    return () => {
      if (hubRef.current) {
        hubRef.current.off("Complete");
        hubRef.current.off("ReceiveAssessmentProgress");
        hubRef.current.stop();
        hubRef.current = null;
      }
    };
  }, []);

  if (gradingAttemptValues.status === GradingStatus.Failed) {
    return <ErrorComponent message="Failed to start grading" />;
  }

  if (assessmentStatus === null)
    return (
      <div className="size-full text-semibold">
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner />
          <span>Starting grading</span>
        </div>
      </div>
    );

  if (assessmentStatus.length === 0) {
    return (
      <div className="size-full text-semibold">
        <div className="flex items-center justify-center h-full">
          <span className="text-destructive">
            No assessments found. Something went wrong.
          </span>
        </div>
      </div>
    );
  }

  const getStatus = (status: GradingStatus) => {
    switch (status) {
      case GradingStatus.Started:
        return "In progress";
      case GradingStatus.Graded:
        return "Completed";
      case GradingStatus.Failed:
        return "Failed";
      default:
        return "Unknown status";
    }
  };

  const sortedAssessmentStatus = [...assessmentStatus].sort((a, b) => {
    const aIsFailed = a.status === AssessmentState.AutoGradingFailed;
    const bIsFailed = b.status === AssessmentState.AutoGradingFailed;
    if (aIsFailed && !bIsFailed) return -1;
    if (!aIsFailed && bIsFailed) return 1;
    return 0;
  });

  return (
    <div className="size-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">
          Grading Progress: {getStatus(gradingAttemptValues.status)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {
            assessmentStatus.filter(
              (assessment) => assessment.status !== AssessmentState.AutoGradingStarted,
            ).length
          }
          /{assessmentStatus.length} assessments graded.
        </p>
      </div>
      {sortedAssessmentStatus.map((assessmentStatus, index) => (
        <div key={index}>
          <AssessmentStatusCard
            status={assessmentStatus}
            onRegrade={handleRegradeAssessment}
          />
        </div>
      ))}
      {gradingAttemptValues.status === GradingStatus.Started && (
        <div className="flex flex-col w-full items-center gap-2">
          <p className="text-center">
            You can go home and come back later to check the grading progress. <br />{" "}
            We'll notify you when it's done.
          </p>
          <Button
            onClick={() =>
              navigate({
                to: "/home",
              })
            }
          >
            Go home
          </Button>
        </div>
      )}
    </div>
  );
}
