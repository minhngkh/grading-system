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
import { GradingService } from "@/services/grading-service";

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

  const handleStartGrading = async () => {
    const token = await auth.getToken();
    if (!token) {
      return toast.error("You must be logged in to start grading");
    }

    await GradingService.startGrading(gradingAttemptValues.id, token);
    gradingAttempt.setValue("status", GradingStatus.Started);
  };

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

  useEffect(() => {
    let isActive = true;

    (async () => {
      if (gradingAttemptValues.status !== GradingStatus.Started || hubRef.current) return;

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

        await handleStartGrading();
        await hub.start();
        hubRef.current = hub;

        const initialState = await hub.invoke("Register", gradingAttemptValues.id);
        handleRegister(isActive, initialState);
      } catch (error) {
        gradingAttempt.setValue("status", GradingStatus.Failed);
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
      {assessmentStatus.map((status, index) => (
        <AssessmentStatusCard key={index} status={status} />
      ))}
    </div>
  );
}
