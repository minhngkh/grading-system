import { GradingStatus, GradingAttempt } from "@/types/grading";
import { usePolling } from "@/hooks/use-polling";
import { getGradingStatus, startGrading } from "@/services/gradingServices";
import Spinner from "@/components/spinner";
import { useCallback, useEffect } from "react";

interface GradingProgressStepProps {
  gradingAttempt: GradingAttempt;
  onGradingAttemptChange: (gradingAttempt?: Partial<GradingAttempt>) => void;
}

export default function GradingProgressStep({
  gradingAttempt,
  onGradingAttemptChange,
}: GradingProgressStepProps) {
  const pollingFn = useCallback(
    () => getGradingStatus(gradingAttempt.id),
    [gradingAttempt.id],
  );

  useEffect(() => {
    const start = async () => {
      try {
        await startGrading(gradingAttempt.id);
        onGradingAttemptChange({ status: GradingStatus.Started });
      } catch (err) {
        console.error(err);
      }
    };
    start();
  }, [gradingAttempt.id, onGradingAttemptChange]);

  const onSuccess = useCallback(
    (status: GradingStatus) => {
      onGradingAttemptChange({ status });
    },
    [onGradingAttemptChange],
  );

  usePolling(pollingFn, onSuccess, {
    interval: 5000,
    enabled: gradingAttempt.status === GradingStatus.Started,
    onError: (error) => {
      console.error("Failed to fetch grading status:", error);
    },
  });

  return (
    <div className="w-full">
      {gradingAttempt.status === GradingStatus.Started ? (
        <div className="flex flex-col items-center justify-center">
          <Spinner />
          <span>Grading in progress...</span>
        </div>
      ) : gradingAttempt.status === GradingStatus.Graded ? (
        <div className="flex items-center justify-center text-green-600">
          <span>Grading completed!</span>
        </div>
      ) : (
        <div className="flex items-center justify-center text-red-600">
          <span>Grading failed.</span>
        </div>
      )}
    </div>
  );
}
