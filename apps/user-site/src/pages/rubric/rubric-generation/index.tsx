import type { Rubric } from "@/types/rubric";
import type { Step } from "@stepperize/react";
import { Button } from "@/components/ui/button";
import { RubricSchema } from "@/types/rubric";
import { zodResolver } from "@hookform/resolvers/zod";
import { defineStepper } from "@stepperize/react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@clerk/clerk-react";
import { useCallback } from "react";
import ChatWindow from "./chat";
import FinalRubricTable from "./review-step";
import PluginRubricTable from "./plugins";
import { useMutation } from "@tanstack/react-query";
import { updateRubricMutationOptions } from "@/queries/rubric-queries";

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
  const navigate = useNavigate();
  const auth = useAuth();
  const stepper = useStepper({ initialStep: rubricStep });
  const currentIndex = utils.getIndex(stepper.current.id);
  const { location } = useRouterState();
  const updateRubricMutation = useMutation(
    updateRubricMutationOptions(initialRubric.id, auth),
  );
  const form = useForm<Rubric>({
    resolver: zodResolver(RubricSchema),
    defaultValues: initialRubric,
  });

  const formValues = form.watch();

  const isNextDisabled = () => {
    const formState = RubricSchema.safeParse(form.getValues());
    return stepper.isFirst && !formState.success;
  };

  const handlePrev = () => {
    stepper.prev();
    sessionStorage.setItem("rubricStep", steps[currentIndex - 1].id);
  };

  const handleNext = async () => {
    if (stepper.isLast) {
      try {
        await updateRubricMutation.mutateAsync(formValues);
        navigate({ to: location.search?.redirect ?? "/rubrics/view", replace: true });
      } catch (err) {
        toast.error("Failed to update rubric");
        console.error(err);
      }

      return;
    }

    stepper.next();
    sessionStorage.setItem("rubricStep", steps[currentIndex + 1].id);
  };

  const onUpdateRubric = useCallback(
    async (updatedRubricData: Partial<Rubric>) => {
      const updatedRubric = {
        ...formValues,
        ...updatedRubricData,
      };

      const result = RubricSchema.safeParse(updatedRubric);
      if (!result.success) {
        throw result.error;
      }

      await updateRubricMutation.mutateAsync(updatedRubric);
      form.reset(updatedRubric);
    },
    [formValues, auth],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="mt-8 space-y-4 flex-1 flex flex-col items-center">
        {stepper.switch({
          input: () => <ChatWindow rubric={formValues} onUpdate={onUpdateRubric} />,
          edit: () => (
            <PluginRubricTable rubricData={formValues} onUpdate={onUpdateRubric} />
          ),
          complete: () => <FinalRubricTable rubricData={formValues} />,
        })}

        <div className="flex w-full justify-end gap-4">
          <Button variant="secondary" onClick={handlePrev} disabled={stepper.isFirst}>
            Back
          </Button>
          <Button disabled={isNextDisabled()} onClick={handleNext}>
            {location.search?.redirect ?
              "Continue"
            : stepper.isLast ?
              "Save"
            : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
