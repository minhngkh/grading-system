import type { Step } from "@stepperize/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { defineStepper } from "@stepperize/react";
import React from "react";
import GradingProgressStep from "./grading-step";
import ResultsStep from "./result-step";
import UploadStep from "./upload-step";

type StepData = {
  title: string;
} & Step;

const { useStepper, steps, utils } = defineStepper<StepData[]>(
  {
    id: "upload",
    title: "Upload Files",
  },
  {
    id: "grading",
    title: "Grade Files",
  },
  {
    id: "review",
    title: "Review Results",
  },
);

export default function UploadAssignmentPage() {
  const stepper = useStepper();
  const currentIndex = utils.getIndex(stepper.current.id);

  const handleNext = () => {
    stepper.next();
  };

  const isNextButtonDisabled = () => {
    // if (stepper.isLast) return true;
    // if (stepper.current.id === "Upload") {
    //   return !selectedRubric || files.length === 0;
    // }
    return false;
  };

  return (
    <div className="container flex flex-col h-full p-10 space-y-10">
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
      <div className="mt-8 space-y-4 flex-1 flex flex-col items-center">
        {
          // TODO: lint error, solution is to change the id to lowercase, check if there
          // is any error
          stepper.switch({
            upload: () => <UploadStep />,
            grading: () => <GradingProgressStep />,
            review: () => <ResultsStep />,
          })
        }

        <div className="flex w-full justify-end gap-4">
          <Button variant="secondary" onClick={stepper.prev} disabled={stepper.isFirst}>
            Back
          </Button>
          <Button disabled={isNextButtonDisabled()} onClick={handleNext}>
            {stepper.isLast ? "Save" : "Start Grading"}
          </Button>
        </div>
      </div>
    </div>
  );
}
