import type { Rubric } from "@/types/rubric";
import type { Step } from "@stepperize/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RubricService } from "@/services/rubric-service";
import { RubricSchema } from "@/types/rubric";
import { zodResolver } from "@hookform/resolvers/zod";
import { defineStepper } from "@stepperize/react";
import { useNavigate } from "@tanstack/react-router";
import { Fragment } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ChatWindow from "./create-step/chat-window";
import { useIsMobile } from "@/hooks/use-mobile";
import PluginRubricTable from "./plugin-step/plugin-rubric-table";
import FinalRubricTable from "./review-step/final-rubric-table";

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
  const isMobile = useIsMobile();

  const form = useForm<Rubric>({
    resolver: zodResolver(RubricSchema),
    defaultValues: initialRubric,
  });

  const isNextDisabled = () => {
    if (stepper.isFirst) {
      return !form.formState.isValid;
    }

    return false;
  };

  const handleNext = async () => {
    if (!form.formState.isValid) {
      return;
    }

    if (stepper.isLast) {
      try {
        await RubricService.updateRubric(initialRubric?.id!, form.getValues());
        navigate({ to: "/manage-rubrics" });
      } catch (err) {
        toast.error("Failed to update rubric");
        console.error(err);
      }

      return;
    }

    stepper.next();
  };

  const onUpdateRubric = async (updatedRubricData: Partial<Rubric>) => {
    try {
      const updatedRubric = {
        ...form.getValues(),
        ...updatedRubricData,
      };

      const result = RubricSchema.safeParse(updatedRubric);

      if (!result.success) {
        throw result.error;
      }

      await RubricService.updateRubric(initialRubric.id, updatedRubricData);
      form.reset(updatedRubric);
    } catch (err) {
      toast.error("Failed to update rubric");
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {!isMobile && (
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
      )}
      <div className="mt-8 space-y-4 flex-1 flex flex-col items-center">
        {stepper.switch({
          input: () => <ChatWindow rubric={form.getValues()} onUpdate={onUpdateRubric} />,
          edit: () => (
            <PluginRubricTable rubricData={form.getValues()} onUpdate={onUpdateRubric} />
          ),
          complete: () => <FinalRubricTable rubricData={form.getValues()} />,
        })}

        <div className="flex w-full justify-end gap-4">
          <Button variant="secondary" onClick={stepper.prev} disabled={stepper.isFirst}>
            Back
          </Button>
          <Button disabled={isNextDisabled()} onClick={handleNext}>
            {stepper.isLast ? "Save" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
