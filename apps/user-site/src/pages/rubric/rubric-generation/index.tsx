import type { Step } from "@stepperize/react";
import type { Rubric } from "@/types/rubric";

import { useAuth } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { defineStepper } from "@stepperize/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PluginConfigDialogs } from "@/consts/plugins";
import { RubricValidationState, validateRubric } from "@/lib/rubric-validate";
import { PluginService } from "@/services/plugin-service";
import { RubricSchema } from "@/types/rubric";

import ChatWindow from "./chat";
import FinalRubricTable from "./final-rubric-table";

type StepData = {
  title: string;
} & Step;

const { useStepper, steps, utils } = defineStepper<StepData[]>(
  {
    id: "input",
    title: "Create Rubric",
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
  const form = useForm<Rubric>({
    resolver: zodResolver(RubricSchema),
    defaultValues: initialRubric,
  });

  const queryClient = useQueryClient();

  const formValues = form.watch();
  
  const onUpdateRubric = useCallback(
    (updatedRubricData: Partial<Rubric>) => {
      const updatedRubric = {
        ...formValues,
        ...updatedRubricData,
      };

      queryClient.invalidateQueries({
        queryKey: ["rubric", updatedRubric.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["rubrics"],
      });

      form.reset(updatedRubric);
    },
    [formValues, form, queryClient],
  );

  const handlePrev = () => {
    stepper.prev();
    sessionStorage.setItem("rubricStep", steps[currentIndex - 1].id);
  };

  const handleNext = async () => {
    // Try to auto-configure any plugins with hasDefault that aren't configured yet
    const updatedCriteria = [...formValues.criteria];
    let needsConfigUpdate = false;
    
    for (let i = 0; i < updatedCriteria.length; i++) {
      const criterion = updatedCriteria[i];
      // Default to "ai" if no plugin is set
      const pluginType = criterion.plugin || "ai";
      
      // If plugin is not set at all, set it to "ai"
      if (!criterion.plugin) {
        updatedCriteria[i] = {
          ...criterion,
          plugin: "ai",
        };
        needsConfigUpdate = true;
      }
      
      // If the plugin is not configured and supports default configs, create one
      if (pluginType !== "None" && 
          (!criterion.configuration || criterion.configuration.trim().length === 0) && 
          PluginConfigDialogs[pluginType]?.hasDefault) {
        try {
          const token = await auth.getToken();
          if (token) {
            const configId = await PluginService.createDefaultConfig(pluginType, token);
            if (configId) {
              updatedCriteria[i] = {
                ...updatedCriteria[i],
                configuration: configId
              };
              needsConfigUpdate = true;
            }
          }
        } catch (error) {
          console.error(`Failed to auto-configure ${pluginType}:`, error);
          // Continue with validation even if auto-config fails
        }
      }
    }
    
    // If we updated any configurations, update the form
    if (needsConfigUpdate) {
      form.setValue('criteria', updatedCriteria);
      onUpdateRubric({ criteria: updatedCriteria });
      toast.success("Auto-configured plugins with default settings");
    }

    // Run validation on the potentially updated form values
    const validationResult = validateRubric(needsConfigUpdate ? {...formValues, criteria: updatedCriteria} : formValues);
    if (validationResult.state === RubricValidationState.VALUE_ERROR) {
      toast.error(validationResult.message);
      return;
    }

    if (validationResult.state === RubricValidationState.PLUGIN_ERROR) {
      toast.error(validationResult.message);
      return;
    }

    if (stepper.isLast) {
      try {
        navigate({ to: location.search?.redirect ?? "/rubrics/view", replace: true });
      } catch (err) {
        toast.error("Failed to update rubric");
        console.error("Failed to update rubric: ", err);
      }

      return;
    }

    stepper.next();
    sessionStorage.setItem("rubricStep", steps[currentIndex + 1].id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mt-8 space-y-4 flex-1 flex flex-col items-center">
        {stepper.switch({
          input: () => <ChatWindow rubric={formValues} onUpdate={onUpdateRubric} />,
          complete: () => <FinalRubricTable rubricData={formValues} />,
        })}

        <div className="flex w-full justify-end gap-4">
          <Button variant="secondary" onClick={handlePrev} disabled={stepper.isFirst}>
            Back
          </Button>
          <Button onClick={handleNext}>
            {stepper.isLast ?
              location.search?.redirect ?
                "Back to grading"
              : "Save"
            : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
