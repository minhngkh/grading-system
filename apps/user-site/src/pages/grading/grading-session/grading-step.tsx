import { GradingStatus, GradingAttempt } from "@/types/grading";
import { usePolling } from "@/hooks/use-polling";
import { GradingService } from "@/services/grading-service";
import { Spinner } from "@/components/app/spinner";
import { useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/clerk-react";
import { UseFormReturn } from "react-hook-form";

interface GradingProgressStepProps {
  form: UseFormReturn<GradingAttempt>;
}

export default function GradingProgressStep({ form }: GradingProgressStepProps) {
  const auth = useAuth();
  const gradingAttempt = form.getValues();

  const pollingFn = useCallback(async () => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("You must be logged in to check grading status.");
    }

    return GradingService.getGradingStatus(gradingAttempt.id, token);
  }, [gradingAttempt.id, auth]);

  const onSuccess = useCallback(
    (status: GradingStatus) => {
      form.setValue("status", status);
    },
    [form],
  );

  usePolling(pollingFn, onSuccess, {
    interval: 5000,
    enabled: gradingAttempt.status === GradingStatus.Started,
    onError: (error) => {
      toast.error(
        error.message ||
          "An error occurred while grading submission. Please try again later.",
      );
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
