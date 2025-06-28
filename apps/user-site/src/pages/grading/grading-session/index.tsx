import type { Step } from "@stepperize/react";
import { Button } from "@/components/ui/button";
import { defineStepper } from "@stepperize/react";
import { useEffect } from "react";
import GradingProgressStep from "./grading-step";
import UploadStep from "./upload-step";
import { GradingAttempt, GradingSchema, GradingStatus } from "@/types/grading";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";

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
  const navigate = useNavigate();
  const stepper = useStepper({ initialStep: initialStep });
  const currentIndex = utils.getIndex(stepper.current.id);
  const gradingAttempt = useForm<GradingAttempt>({
    resolver: zodResolver(GradingSchema),
    defaultValues: initialGradingAttempt,
  });
  const gradingAttemptValues = gradingAttempt.watch();

  useEffect(() => {
    if (initialGradingAttempt.status === GradingStatus.Started) {
      stepper.goTo(steps[1].id);
      sessionStorage.setItem("gradingStep", steps[1].id);
    } else if (initialGradingAttempt.status === GradingStatus.Graded) {
      navigate({
        to: "/gradings/$gradingId/result",
        params: { gradingId: gradingAttemptValues.id },
      });
    }
  }, []);

  const handlePrev = () => {
    stepper.prev();
    sessionStorage.setItem("gradingStep", steps[currentIndex - 1].id);
  };

  const handleNext = async () => {
    switch (currentIndex) {
      case 0:
        const isValid = await gradingAttempt.trigger();
        if (!isValid) return;

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
    if (currentIndex === 1) return gradingAttemptValues.status === GradingStatus.Started;
    return false;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mt-8 space-y-4 flex-1">
        {stepper.switch({
          upload: () => <UploadStep form={gradingAttempt} />,
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
