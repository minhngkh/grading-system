import type { Rubric } from "@/types/rubric";
import type { Step } from "@stepperize/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ChatWindow from "@/pages/features/rubric-generation/chat-window";
import { updateRubric } from "@/services/rubricService";
import { RubricSchema } from "@/types/rubric";
import { zodResolver } from "@hookform/resolvers/zod";
import { defineStepper } from "@stepperize/react";
import { useNavigate } from "@tanstack/react-router";
import { Fragment } from "react";
import { useForm } from "react-hook-form";
import RubricTable from "./rubric-table";

const itemIdentifier = "rubric-gen";

type StepData = {
  title: string;
} & Step;

const { useStepper, steps, utils } = defineStepper<StepData[]>(
  {
    id: "input",
    title: "Create Rubric",
  },
  {
    id: "edit",
    title: "Configure Plugin",
  },
  {
    id: "complete",
    title: "Complete",
  },
);

interface RubricGenerationPageProps {
  initialRubric: Rubric;
}

export default function RubricGenerationPage({
  initialRubric,
}: RubricGenerationPageProps) {
  const stepper = useStepper();
  const currentIndex = utils.getIndex(stepper.current.id);
  const navigate = useNavigate();

  const form = useForm<Rubric>({
    resolver: zodResolver(RubricSchema),
    defaultValues: initialRubric,
  });

  const handleNext = async () => {
    if (stepper.isLast) {
      const isValid = await form.trigger();
      if (!isValid) {
        return;
      }

      try {
        await updateRubric(initialRubric?.id!, form.getValues());
        sessionStorage.removeItem(itemIdentifier);
      } catch (err) {
        console.error(err);
      } finally {
        navigate({ to: "/manage-rubrics" });
      }
      return;
    }

    if (form.getValues()) stepper.next();
  };

  const onUpdateRubric = async (updatedRubric: Rubric) => {
    try {
      const parsed = RubricSchema.parse(updatedRubric);
      form.reset(parsed);
      await updateRubric(initialRubric?.id!, parsed);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <nav aria-label="Checkout Steps" className="group my-4">
        <ol
          className="flex items-center justify-between gap-2"
          aria-orientation="horizontal"
        >
          {stepper.all.map((step, index, array) => (
            <Fragment key={step.id}>
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
            </Fragment>
          ))}
        </ol>
      </nav>
      <div className="mt-8 space-y-4 flex-1 flex flex-col items-center">
        {stepper.switch({
          input: () => <ChatWindow rubric={form.getValues()} onUpdate={onUpdateRubric} />,
          edit: () => <RubricTable rubricData={form.getValues()} canEdit={false} />,
          complete: () => <RubricTable rubricData={form.getValues()} canEdit={false} />,
        })}

        <div className="flex w-full justify-end gap-4">
          <Button variant="secondary" onClick={stepper.prev} disabled={stepper.isFirst}>
            Back
          </Button>
          <Button onClick={handleNext}>{stepper.isLast ? "Save" : "Next"}</Button>
        </div>
      </div>
    </div>
  );
}
