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

const PluginConfigDialogs: Record<string, PluginDialogComponent> = {
  "code-runner": CodeRunnerConfigDialog,
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
  const [pluginDialogOpen, setPluginDialogOpen] = useState(false);
  const [pluginDialogConfigOpen, setPluginDialogConfigOpen] = useState(false);
  const [ActivePluginConfigDialog, setActivePluginConfigDialog] =
    useState<PluginDialogComponent>();
  const [selectedCriterionIndex, setSelectedCriterionIndex] = useState<number>();

  const openPluginDialog = (criterionIndex: number) => {
    setSelectedCriterionIndex(criterionIndex);
    setPluginDialogOpen(true);
  };

  const onPluginSelect = async (plugin: string, criterionIndex: number) => {
    try {
      const updatedCriteria = rubricData.criteria.map((criterion, idx) => {
        if (idx === criterionIndex) {
          return {
            ...criterion,
            plugin: criterion.plugin === plugin ? undefined : plugin,
          };
        }
        return criterion;
      });

      await onUpdate?.({ criteria: updatedCriteria });
      if (PluginConfigDialogs[plugin]) {
        setActivePluginConfigDialog(PluginConfigDialogs[plugin]);
        setPluginDialogConfigOpen(true);
      }
    } catch (error) {
      console.error("Error selecting plugin:", error);
      toast.error("Failed to select plugin. Please try again.");
    }
  };

  const handleConfigChange = async (config: string, criterionIndex: number) => {
    try {
      const updatedCriteria = rubricData.criteria.map((criterion, idx) => {
        if (idx === criterionIndex) {
          return {
            ...criterion,
            configuration: config,
          };
        }
        return criterion;
      });

      await onUpdate?.({ criteria: updatedCriteria });
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
        {ActivePluginConfigDialog && pluginDialogConfigOpen && (
          <ActivePluginConfigDialog
            criterionIndex={selectedCriterionIndex!}
            open={pluginDialogConfigOpen}
            onOpenChange={setPluginDialogConfigOpen}
            onCriterionConfigChange={handleConfigChange}
          />
        )}
        {pluginDialogOpen && (
          <PluginSelectDialog
            criterion={rubricData.criteria[selectedCriterionIndex!]}
            open={pluginDialogOpen}
            onOpenChange={setPluginDialogOpen}
            onSelect={(plugin) => onPluginSelect(plugin, selectedCriterionIndex!)}
          />
        )}
      </CardContent>
    </Card>
  );
}
