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
import { useMutation } from "@tanstack/react-query";
import { rerunAssessmentMutationOptions } from "@/queries/assessment-queries";
import { startGradingMutationOptions } from "@/queries/grading-queries";
import ErrorComponent from "@/components/app/route-error";

interface GradingProgressStepProps {
  gradingAttempt: UseFormReturn<GradingAttempt>;
}

export default function GradingProgressStep({
  gradingAttempt,
}: GradingProgressStepProps) {
  const auth = useAuth();
  const gradingAttemptValues = gradingAttempt.watch();
  const [assessmentStatus, setAssessmentStatus] = useState<
    AssessmentGradingStatus[] | null
  >(null);
  const rerunAssessmentMutation = useMutation(rerunAssessmentMutationOptions(auth));
  const { mutateAsync: startGrading } = useMutation(
    startGradingMutationOptions(gradingAttemptValues.id, auth, {
      onSuccess: () => {
        gradingAttempt.setValue("status", GradingStatus.Started);
      },
      onError: (error) => {
        gradingAttempt.setValue("status", GradingStatus.Failed);
        console.error("Failed to start grading:", error);
        toast.error("Failed to start grading. Please try again.");
      },
    }),
  );

  const handleGradingStatusChange = (isActive: boolean, newStatus: GradingStatus) => {
    if (!isActive) return;
    gradingAttempt.setValue("status", newStatus);
  };

  const handleStatusChange = (isActive: boolean, newStatus: AssessmentGradingStatus) => {
    if (!isActive) return;

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
      handleGradingStatusChange(
        gradingAttemptValues.status !== GradingStatus.Started,
        GradingStatus.Started,
      );
    } catch (error) {
      console.error("Failed to regrade assessment:", error);
      toast.error(`Failed to regrade assessment. Please try again.`);
    }
  };

  const hubRef = useRef<SignalRService | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    const initGrading = async () => {
      if (hubRef.current || hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      const token = await auth.getToken();
      if (!token) return;

      try {
        const hub = new SignalRService(() => token);

        hub.on("ReceiveAssessmentProgress", (assessmentStatus) =>
          handleStatusChange(isActive, assessmentStatus),
        );
        hub.on("Complete", () =>
          handleGradingStatusChange(isActive, GradingStatus.Graded),
        );

        if (gradingAttemptValues.status === GradingStatus.Created) {
          await startGrading();
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
      isActive = false;
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
    </div>
  );
}
