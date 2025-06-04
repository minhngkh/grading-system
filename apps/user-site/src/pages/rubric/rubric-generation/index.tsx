import type { Rubric } from "@/types/rubric";
import type { Step } from "@stepperize/react";
import { Button } from "@/components/ui/button";
import { RubricService } from "@/services/rubric-service";
import { RubricSchema } from "@/types/rubric";
import { zodResolver } from "@hookform/resolvers/zod";
import { defineStepper } from "@stepperize/react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ChatWindow from "./create-step";
import PluginRubricTable from "./plugin-step";
import FinalRubricTable from "./review-step";

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
  rubricStep?: string;
}

export default function RubricGenerationPage({
  initialRubric,
  rubricStep,
}: RubricGenerationPageProps) {
  const stepper = useStepper({ initialStep: rubricStep });
  const currentIndex = utils.getIndex(stepper.current.id);
  const navigate = useNavigate();

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

  const handlePrev = () => {
    stepper.prev();
    sessionStorage.setItem("rubricStep", steps[currentIndex - 1].id);
  };

  const handleNext = async () => {
    if (!form.formState.isValid) {
      return;
    }

    if (stepper.isLast) {
      try {
        await RubricService.updateRubric(initialRubric?.id!, form.getValues());
        navigate({ to: "/rubrics" });
      } catch (err) {
        toast.error("Failed to update rubric");
        console.error(err);
      }

      return;
    }

    stepper.next();
    sessionStorage.setItem("rubricStep", steps[currentIndex + 1].id);
  };

  const onUpdateRubric = async (updatedRubricData: Partial<Rubric>) => {
    try {
      const updatedRubric = {
        ...form.getValues(),
        ...updatedRubricData,
      };

      console.log("Updated Rubric Data:", updatedRubric);

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
      <div className="mt-8 space-y-4 flex-1 flex flex-col items-center">
        {stepper.switch({
          input: () => <ChatWindow rubric={form.getValues()} onUpdate={onUpdateRubric} />,
          edit: () => (
            <PluginRubricTable rubricData={form.getValues()} onUpdate={onUpdateRubric} />
          ),
          complete: () => <FinalRubricTable rubricData={form.getValues()} />,
        })}

        <div className="flex w-full justify-end gap-4">
          <Button variant="secondary" onClick={handlePrev} disabled={stepper.isFirst}>
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
