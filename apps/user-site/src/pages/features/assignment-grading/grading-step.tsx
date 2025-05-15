import { useEffect } from "react";
import { GradingStatus, GradingAttempt } from "@/types/grading";
import { usePolling } from "@/hooks/use-polling";
import { getGradingStatus } from "@/services/gradingServices";
import Spinner from "@/components/spinner";

interface GradingProgressStepProps {
  gradingAttempt: GradingAttempt;
  setHandleNextCallback?: (cb: () => Promise<void>) => void;
  onGradingAttemptChange: (gradingAttempt?: Partial<GradingAttempt>) => void;
}

export default function GradingProgressStep({
  gradingAttempt,
  setHandleNextCallback,
  onGradingAttemptChange,
}: GradingProgressStepProps) {
  const { stop } = usePolling(
    () => getGradingStatus(gradingAttempt.id),
    (status) => {
      onGradingAttemptChange({ status });
      if (status === GradingStatus.Graded || status === GradingStatus.Failed) {
        stop();
      }
    },
    {
      interval: 5000,
      onError: (error) => {
        console.error("Failed to fetch grading status:", error);
      },
    },
  );

  useEffect(() => {
    setHandleNextCallback?.(async () => {});
  }, [setHandleNextCallback]);

  return (
    <div className="w-full">
      {gradingAttempt.status === GradingStatus.Started ? (
        <div className="flex items-center justify-center">
          <Spinner />
          <span>Grading in progress...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <Spinner color="green-400" />
          <span>Grading completed!</span>
        </div>
      )}
    </div>
  );
}
