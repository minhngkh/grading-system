import type { Step } from "@stepperize/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { defineStepper } from "@stepperize/react";
import React, { useState } from "react";
import GradingProgressStep from "./grading-step";
import GradingResult from "../../review/grading-result";
import UploadStep from "./upload-step";
import { GradingAttempt, GradingSchema, GradingStatus } from "@/types/grading";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { GradingService } from "@/services/grading-service";
import { toast } from "sonner";

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
  {
    id: "review",
    title: "Review Results",
    nextButtonTitle: "Finish",
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
  const stepper = useStepper({
    initialStep,
  });
  const currentIndex = utils.getIndex(stepper.current.id);
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const gradingAttempt = useForm<GradingAttempt>({
    resolver: zodResolver(GradingSchema),
    defaultValues: initialGradingAttempt,
  });

  const gradingAttemptValues = gradingAttempt.getValues();
  const handleUpdateGradingAttempt = (updated?: Partial<GradingAttempt>) => {
    gradingAttempt.reset({
      ...gradingAttemptValues,
      ...updated,
    });
  };

  const handlePrev = () => {
    stepper.prev();
    sessionStorage.setItem("gradingStep", stepper.current.id);
  };

  const handleNext = async () => {
    switch (currentIndex) {
      case 0:
        try {
          setIsUploading(true);
          await GradingService.startGrading(gradingAttemptValues.id);
          handleUpdateGradingAttempt({ status: GradingStatus.Started });
        } catch (err) {
          toast.error("Failed to start grading");
          console.error("Error starting grading:", err);
          return;
        } finally {
          setIsUploading(false);
        }
        break;
      case 1:
        if (gradingAttemptValues.status === GradingStatus.Started) return;
        break;
      case 2:
        return navigate({ to: "/home" });
    }

    stepper.next();
    sessionStorage.setItem("gradingStep", stepper.current.id);
  };

  const isNextButtonDisabled = () => {
    if (isUploading) return true;
    if (currentIndex === 1) return gradingAttemptValues.status === GradingStatus.Started;
    return false;
  };

  return (
    <div className="flex flex-col h-full">
      <nav aria-label="Checkout Steps" className="group my-4">
        <ol
          className="flex items-center justify-between gap-2"
          aria-orientation="horizontal"
        >
          {stepper.all.map((step, index, array) => (
            <React.Fragment key={step.id}>
              <li className="flex items-center gap-4 flex-shrink-0">
                <Button
                  type="button"
                  role="tab"
                  variant={index <= currentIndex ? "default" : "secondary"}
                  aria-current={stepper.current.id === step.id ? "step" : undefined}
                  aria-posinset={index + 1}
                  aria-setsize={steps.length}
                  aria-selected={stepper.current.id === step.id}
                  className="flex size-8 items-center justify-center rounded-full"
                >
                  {index + 1}
                </Button>
                <span className="text-sm font-medium">{step.title}</span>
              </li>
              {index < array.length - 1 && (
                <Separator
                  className={`flex-1 ${index < currentIndex ? "bg-primary" : "bg-muted"}`}
                />
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>
      <div className="mt-8 space-y-4 flex-1">
        {stepper.switch({
          upload: () => (
            <UploadStep
              gradingAttempt={gradingAttemptValues}
              onGradingAttemptChange={handleUpdateGradingAttempt}
            />
          ),
          grading: () => (
            <GradingProgressStep
              gradingAttempt={gradingAttemptValues}
              onGradingAttemptChange={handleUpdateGradingAttempt}
            />
          ),
          review: () => <GradingResult gradingAttempt={gradingAttemptValues} />,
        })}
      </div>
      <div className="flex w-full justify-end gap-4">
        <Button variant="secondary" onClick={handlePrev} disabled={stepper.isFirst}>
          Back
        </Button>
        <Button disabled={isNextButtonDisabled()} onClick={handleNext}>
          {stepper.current.nextButtonTitle}
        </Button>
      </div>
    </div>
  );
}
