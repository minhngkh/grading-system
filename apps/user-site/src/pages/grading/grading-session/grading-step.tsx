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
    async () => GradingService.getGradingStatus(gradingAttempt.id),
    [gradingAttempt.id],
  );

  const onSuccess = useCallback(
    (status: GradingStatus) => {
      console.log("Grading status updated:", status);
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
    <div className="size-full text-semibold">
      {gradingAttempt.status === GradingStatus.Started ?
        <div className="flex flex-col items-center justify-center size-full">
          <Spinner />
          <span>Grading in progress...</span>
        </div>
      : gradingAttempt.status === GradingStatus.Graded ?
        <div className="flex items-center justify-center text-green-600 size-full">
          <span>Grading completed!</span>
        </div>
      : <div className="flex items-center justify-center text-red-600 size-full">
          <span>Grading failed.</span>
        </div>
      }
    </div>
  );
}
