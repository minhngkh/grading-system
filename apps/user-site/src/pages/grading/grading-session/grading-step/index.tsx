import { GradingAttempt, GradingStatus } from "@/types/grading";
import { useEffect, useRef, useState } from "react";
import { SignalRService } from "@/services/realtime-service";
import { Spinner } from "@/components/app/spinner";
import { useAuth } from "@clerk/clerk-react";
import { AssessmentGradingStatus } from "@/types/grading-progress";
import { UseFormReturn } from "react-hook-form";
import { AssessmentStatusCard } from "@/pages/grading/grading-session/grading-step/status-card";

interface GradingProgressStepProps {
  gradingAttempt: UseFormReturn<GradingAttempt>;
}

export default function GradingProgressStep({
  gradingAttempt,
}: GradingProgressStepProps) {
  const auth = useAuth();
  const gradingId = gradingAttempt.watch("id");

  const [assessmentStatus, setAssessmentStatus] = useState<
    AssessmentGradingStatus[] | null
  >(null);
  const hubRef = useRef<SignalRService | null>(null);

  const handleGradingStatusChange = (isActive: boolean, newStatus: GradingStatus) => {
    if (!isActive) return;
    gradingAttempt.setValue("status", newStatus);
  };

  const handleStatusChange = (
    isActive: boolean,
    newStatus: AssessmentGradingStatus[],
  ) => {
    if (!isActive) return;
    setAssessmentStatus(newStatus);
  };

  const handleRegister = (
    isActive: boolean,
    initialStatus: AssessmentGradingStatus[],
  ) => {
    if (!isActive) return;
    setAssessmentStatus(initialStatus);
  };

  useEffect(() => {
    let isActive = true;

    (async () => {
      if (hubRef.current) return;

      const token = await auth.getToken();
      if (!token) return;

      const hub = new SignalRService(() => token);
      hub.on("Register", (initialStatus) => handleRegister(isActive, initialStatus));
      hub.on("ReceiveAssessmentProgress", (assessmentStatus) =>
        handleStatusChange(isActive, assessmentStatus),
      );
      hub.on("ReceiveGradingStatusProgress", (status) =>
        handleGradingStatusChange(isActive, status),
      );

      await hub.start();
      await hub.invoke("Register", gradingId);

      hubRef.current = hub;
    })();

    return () => {
      isActive = false;
      if (hubRef.current) {
        hubRef.current.off("GradingStatusChanged");
        hubRef.current.stop();
      }
    };
  }, []);

  if (assessmentStatus === null)
    return (
      <div className="size-full text-semibold">
        <div className="flex items-center justify-center h-full">
          <Spinner />
          <span>Loading assessment status...</span>
        </div>
      </div>
    );

  if (assessmentStatus.length === 0) {
    return (
      <div className="size-full text-semibold">
        <div className="flex items-center justify-center h-full">
          <span className="text-destructive">No assessments found.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full space-y-6">
      <h2 className="text-2xl font-semibold">Grading Progress</h2>
      {assessmentStatus.map((status, index) => (
        <AssessmentStatusCard key={index} status={status} />
      ))}
    </div>
  );
}
