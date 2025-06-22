import type { Step } from "@stepperize/react";
import { Button } from "@/components/ui/button";
import { defineStepper } from "@stepperize/react";
import { useCallback, useEffect, useState } from "react";
import GradingProgressStep from "./grading-step";
import UploadStep from "./upload-step";
import { GradingAttempt, GradingSchema, GradingStatus } from "@/types/grading";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { GradingService } from "@/services/grading-service";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import PendingComponent from "@/components/app/route-pending";

type StepData = {
  title: string;
} & Step;

const { useStepper, steps, utils } = defineStepper<StepData[]>(
  {
    id: "upload",
    title: "Upload Files",
    nextButtonTitle: "Start Grading",
  },
  {
    id: "grading",
    title: "Grade Files",
    nextButtonTitle: "View Results",
  },
);

interface UploadAssignmentPageProps {
  initialGradingAttempt: GradingAttempt;
  initialStep?: string;
}

export default function UploadAssignmentPage({
  initialGradingAttempt,
  initialStep,
}: UploadAssignmentPageProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const stepper = useStepper({ initialStep: initialStep });
  const currentIndex = utils.getIndex(stepper.current.id);
  const [isStarting, setIsStarting] = useState(false);

  const gradingAttempt = useForm<GradingAttempt>({
    resolver: zodResolver(GradingSchema),
    defaultValues: initialGradingAttempt,
  });
  const gradingAttemptValues = gradingAttempt.watch();

  useEffect(() => {
    if (
      (!initialStep || initialStep === "upload") &&
      initialGradingAttempt.status !== GradingStatus.Created
    ) {
      stepper.next();
      sessionStorage.setItem("gradingStep", steps[1].id);
    }
  }, []);

  const handleUpdateGradingAttempt = useCallback(
    (updated: Partial<GradingAttempt>) => {
      gradingAttempt.reset({
        ...gradingAttempt.getValues(),
        ...updated,
      });
    },
    [auth, gradingAttempt],
  );

  const handlePrev = () => {
    stepper.prev();
    sessionStorage.setItem("gradingStep", steps[currentIndex - 1].id);
  };

  const handleStartGrading = async () => {
    const isValid = await gradingAttempt.trigger();
    if (!isValid) return;

    const token = await auth.getToken();
    if (!token) {
      return toast.error("You must be logged in to start grading");
    }

    await GradingService.startGrading(gradingAttemptValues.id, token);
    handleUpdateGradingAttempt({ status: GradingStatus.Started });
  };

  const handleNext = async () => {
    switch (currentIndex) {
      case 0:
        const isValid = await gradingAttempt.trigger();
        if (!isValid) return;

        try {
          setIsStarting(true);
          await handleStartGrading();
        } catch (err) {
          console.error("Error starting grading:", err);
          return toast.error("Failed to start grading. Please try again.");
        } finally {
          setIsStarting(false);
        }

        break;
      case 1:
        if (gradingAttemptValues.status === GradingStatus.Started) return;
        return navigate({
          to: "/gradings/$gradingId/result",
          params: { gradingId: gradingAttemptValues.id },
        });
      case 2:
        return navigate({ to: "/gradings/view" });
    }

    stepper.next();
    sessionStorage.setItem("gradingStep", steps[currentIndex + 1].id);
  };

  const isBackButtonDisabled = () => {
    if (currentIndex === 0) return true;
    if (currentIndex === 1) {
      if (gradingAttemptValues.status === GradingStatus.Started) {
        return true;
      }

      if (gradingAttemptValues.status === GradingStatus.Graded) {
        return true;
      }
    }
    return false;
  };

  const isNextButtonDisabled = () => {
    if (isStarting) return true;
    if (currentIndex === 1) return gradingAttemptValues.status === GradingStatus.Started;
    return false;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mt-8 space-y-4 flex-1">
        {stepper.switch({
          upload: () => {
            return isStarting ?
                <PendingComponent message="Starting grading session..." />
              : <UploadStep form={gradingAttempt} />;
          },
          grading: () => <GradingProgressStep gradingAttempt={gradingAttempt} />,
        })}
      </div>
      <div className="flex w-full justify-end gap-4">
        <Button
          variant="secondary"
          onClick={handlePrev}
          disabled={isBackButtonDisabled()}
        >
          Back
        </Button>
        <Button disabled={isNextButtonDisabled()} onClick={handleNext}>
          {stepper.current.nextButtonTitle}
        </Button>
      </div>
    </div>
  );
}
