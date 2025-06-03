import { GradingStatus, GradingAttempt } from "@/types/grading";
import { usePolling } from "@/hooks/use-polling";
import { GradingService } from "@/services/grading-service";
import Spinner from "@/components/app/spinner";
import { useCallback } from "react";
import { toast } from "sonner";

interface GradingProgressStepProps {
  gradingAttempt: GradingAttempt;
  onGradingAttemptChange: (gradingAttempt?: Partial<GradingAttempt>) => void;
}

export default function GradingProgressStep({
  gradingAttempt,
  onGradingAttemptChange,
}: GradingProgressStepProps) {
  const pollingFn = useCallback(
    () => GradingService.getGradingStatus(gradingAttempt.id),
    [gradingAttempt.id],
  );

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
      toast.error("Failed to fetch grading status");
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
