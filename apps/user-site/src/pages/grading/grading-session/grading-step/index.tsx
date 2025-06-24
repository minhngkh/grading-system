import { GradingAttempt, GradingStatus } from "@/types/grading";
import { useEffect, useRef, useState } from "react";
import { SignalRService } from "@/services/realtime-service";
import { Spinner } from "@/components/app/spinner";
import { useAuth } from "@clerk/clerk-react";
import { AssessmentGradingStatus } from "@/types/grading-progress";
import { UseFormReturn } from "react-hook-form";
import { AssessmentStatusCard } from "@/pages/grading/grading-session/grading-step/status-card";
import { AssessmentState } from "@/types/assessment";
import { GradingService } from "@/services/grading-service";
import { AssessmentService } from "@/services/assessment-service";
import { toast } from "sonner";

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
  const hubRef = useRef<SignalRService | null>(null);

  const handleGradingStatusChange = (isActive: boolean, newStatus: GradingStatus) => {
    if (!isActive) return;
    gradingAttempt.setValue("status", newStatus);
  };

  const handleStatusChange = (isActive: boolean, newStatus: AssessmentGradingStatus) => {
    if (!isActive) return;

    setAssessmentStatus((prev) => {
      if (!prev) return [newStatus];

      const exists = prev.some((item) => item.id === newStatus.id);

      if (!exists) {
        return [...prev, newStatus];
      }

      return prev.map((item) => (item.id === newStatus.id ? newStatus : item));
    });
  };

  const handleRegister = (
    isActive: boolean,
    initialStatus: AssessmentGradingStatus[],
  ) => {
    if (!isActive) return;
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
    const token = await auth.getToken();
    if (!token) return;

    try {
      await AssessmentService.rerunAssessment(assessmentId, token);
      if (gradingAttemptValues.status !== GradingStatus.Started) {
        handleGradingStatusChange(true, GradingStatus.Started);
      }
    } catch (error) {
      console.error("Failed to regrade assessment:", error);
      toast.error(`Failed to regrade assessment. Please try again.`);
    }
  };

  useEffect(() => {
    let isActive = true;

    (async () => {
      if (hubRef.current) return;

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

        await GradingService.startGrading(gradingAttemptValues.id, token);
        gradingAttempt.setValue("status", GradingStatus.Started);
        await hub.start();
        hubRef.current = hub;

        const initialState = await hub.invoke("Register", gradingAttemptValues.id);
        handleRegister(isActive, initialState);
      } catch (error) {
        gradingAttempt.setValue("status", GradingStatus.Failed);
        console.error("Failed to start grading:", error);
        toast.error("Failed to start grading. Please try again.");
      }
    })();

    return () => {
      isActive = false;
      if (hubRef.current) {
        hubRef.current.off("Complete");
        hubRef.current.off("ReceiveAssessmentProgress");
        hubRef.current.stop();
      }
    };
  }, []);

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
      {sortedAssessmentStatus.map((assessmentStatus) => (
        <AssessmentStatusCard
          key={assessmentStatus.id}
          status={assessmentStatus}
          onRegrade={handleRegradeAssessment}
        />
      ))}
    </div>
  );
}
