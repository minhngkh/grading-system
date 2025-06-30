import type { Rubric } from "@/types/rubric";
import { RubricView } from "@/components/app/rubric-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { PluginDialogComponent } from "./type";
import CodeRunnerConfigDialog from "./code-runner";
import { toast } from "sonner";
import { PluginSelectDialog } from "./plugin-select-dialog";
import { useMutation } from "@tanstack/react-query";
import { updateRubricMutationOptions } from "@/queries/rubric-queries";
import { useAuth } from "@clerk/clerk-react";

const PluginConfigDialogs: Record<string, PluginDialogComponent> = {
  "Test Runner": CodeRunnerConfigDialog,
  // add other plugins here
};

interface PluginRubricTableProps {
  rubricData: Rubric;
  onUpdate?: (updatedRubric: Partial<Rubric>) => Promise<void>;
}

export default function PluginRubricTable({
  rubricData,
  onUpdate,
}: PluginRubricTableProps) {
  const auth = useAuth();
  const [pluginDialogOpen, setPluginDialogOpen] = useState(false);
  const [pluginDialogConfigOpen, setPluginDialogConfigOpen] = useState(false);
  const [ActivePluginConfigDialog, setActivePluginConfigDialog] =
    useState<PluginDialogComponent>();
  const [selectedCriterionIndex, setSelectedCriterionIndex] = useState<number>();
  const updateRubricMutation = useMutation(
    updateRubricMutationOptions(rubricData.id, auth),
  );

  const openPluginDialog = (criterionIndex: number) => {
    setSelectedCriterionIndex(criterionIndex);
    setPluginDialogOpen(true);
  };

  const onPluginSelect = async (plugin: string) => {
    try {
      const updatedCriteria = rubricData.criteria.map((criterion, idx) => {
        if (idx === selectedCriterionIndex) {
          return {
            ...criterion,
            plugin: criterion.plugin === plugin ? undefined : plugin,
          };
        }
        return criterion;
      });

      await updateRubricMutation.mutateAsync({ criteria: updatedCriteria });
      onUpdate?.({ criteria: updatedCriteria });
      setPluginDialogOpen(false);

      const component = PluginConfigDialogs[plugin];
      if (component) {
        setActivePluginConfigDialog(() => component);
        setPluginDialogConfigOpen(true);
      }
    } catch (error) {
      console.error("Error selecting plugin:", error);
      toast.error("Failed to select plugin. Please try again.");
    }
  };

  const handleConfigChange = async (config: string) => {
    try {
      const updatedCriteria = rubricData.criteria.map((criterion, idx) => {
        if (idx === selectedCriterionIndex) {
          return {
            ...criterion,
            configuration: config,
          };
        }
        return criterion;
      });

      await updateRubricMutation.mutateAsync({ criteria: updatedCriteria });
      onUpdate?.({ criteria: updatedCriteria });
      setPluginDialogConfigOpen(false);
    } catch (error) {
      console.error("Error updating Code Runner configuration:", error);
      toast.error("Failed to update Code Runner configuration. Please try again.");
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{rubricData.rubricName}</CardTitle>
        <CardDescription>
          Configure the tools used for grading each criterion. If you need to edit a
          plugin, click on the plugin name to select a different one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <RubricView
          rubricData={rubricData}
          showPlugins
          editPlugin
          onPluginSelect={openPluginDialog}
        />
        {ActivePluginConfigDialog && selectedCriterionIndex !== undefined && (
          <ActivePluginConfigDialog
            configId={rubricData.criteria[selectedCriterionIndex]?.configuration}
            open={pluginDialogConfigOpen}
            onOpenChange={setPluginDialogConfigOpen}
            onCriterionConfigChange={handleConfigChange}
          />
        )}
        {selectedCriterionIndex !== undefined && (
          <PluginSelectDialog
            currentPlugin={rubricData?.criteria[selectedCriterionIndex]?.plugin}
            open={pluginDialogOpen}
            onOpenChange={setPluginDialogOpen}
            onSelect={onPluginSelect}
          />
        )}
      </CardContent>
    </Card>
  );
}
