import type { Step } from "@stepperize/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { defineStepper } from "@stepperize/react";
import React, { useState } from "react";
import GradingProgressStep from "./grading-step";
import ResultsStep from "./result-step";
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
  {
    id: "review",
    title: "Review Results",
    nextButtonTitle: "Finish",
  },
);

interface UploadAssignmentPageProps {
  initialGradingAttempt: GradingAttempt;
  initalStep?: string;
}

export default function UploadAssignmentPage({
  initialGradingAttempt,
  initalStep,
}: UploadAssignmentPageProps) {
  const stepper = useStepper({
    initialStep: initalStep,
  });
  const currentIndex = utils.getIndex(stepper.current.id);
  const navigate = useNavigate();
  const [nextCallback, setNextCallback] = useState<(values?: any) => Promise<void>>();
  const [isUploading, setIsUploading] = useState(false);

  const gradingAttempt = useForm<GradingAttempt>({
    resolver: zodResolver(GradingSchema),
    defaultValues: initialGradingAttempt,
  });

  const gradingAttemptValues = gradingAttempt.watch();

  const handleUpdateGradingAttempt = (updated?: Partial<GradingAttempt>) => {
    gradingAttempt.reset(updated);
  };

  const handleNext = async () => {
    try {
      await nextCallback?.(currentIndex === 0 ? setIsUploading : undefined);
    } catch {
      return;
    }

    if (currentIndex === 1 && gradingAttemptValues.status === GradingStatus.Started)
      return;

    if (currentIndex === 2) return navigate({ to: "/home" });

    stepper.next();
    sessionStorage.setItem("gradingStep", stepper.current.id);
  };

  const isNextButtonDisabled = () => {
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
          upload: () => {
            if (isUploading) {
              return (
                <div className="flex items-center justify-center h-full">
                  <p className="text-lg font-semibold">
                    Uploading assignment and starting...
                  </p>
                </div>
              );
            }

            return (
              <UploadStep
                setHandleNextCallback={setNextCallback}
                gradingAttempt={gradingAttemptValues}
                onGradingAttemptChange={handleUpdateGradingAttempt}
              />
            );
          },
          grading: () => (
            <GradingProgressStep
              gradingAttempt={gradingAttemptValues}
              setHandleNextCallback={setNextCallback}
              onGradingAttemptChange={handleUpdateGradingAttempt}
            />
          ),
          review: () => <ResultsStep />,
        })}
      </div>
      <div className="flex w-full justify-end gap-4">
        <Button variant="secondary" onClick={stepper.prev} disabled={stepper.isFirst}>
          Back
        </Button>
        <Button disabled={isNextButtonDisabled()} onClick={handleNext}>
          {stepper.current.nextButtonTitle}
        </Button>
      </div>
    </div>
  );
}
