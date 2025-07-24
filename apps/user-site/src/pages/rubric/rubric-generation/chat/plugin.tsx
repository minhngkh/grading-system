import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rubric } from "@/types/rubric";
import { PluginConfigDialogs, PluginName } from "@/consts/plugins";
import { getAllPluginsQueryOptions } from "@/queries/plugin-queries";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plugin } from "@/types/plugin";
import { Button } from "@/components/ui/button";
import { updateRubricMutationOptions } from "@/queries/rubric-queries";
import { toast } from "sonner";
import { PluginComponent } from "@/plugins/type";
import { useState } from "react";

interface PluginTabProps {
  rubricData: Rubric;
  onUpdate?: (updatedRubric: Partial<Rubric>) => void;
}

const getPluginName = (pluginKey?: string) => {
  if (!pluginKey) {
    return PluginName.ai;
  }
  return PluginName[pluginKey as keyof typeof PluginName] || pluginKey;
};

function PluginConfiguration({ rubricData, onUpdate }: PluginTabProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selectedCriterionIndex, setSelectedCriterionIndex] = useState<number>();
  const [ActivePluginConfigView, setActivePluginConfigView] = useState<
    PluginComponent | undefined
  >(undefined);

  const { isLoading, data } = useQuery(
    getAllPluginsQueryOptions(auth, {
      staleTime: Infinity,
    }),
  );

  const plugins: Plugin[] = [
    ...(data || []),
    {
      id: "None",
      name: "Manual Grading",
      description: "Leave this criterion ungraded and manually grade later",
      enabled: true,
      categories: [],
    },
  ];

  const updateRubricMutation = useMutation(
    updateRubricMutationOptions(rubricData.id, auth, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["rubric", rubricData.id],
        });
      },
    }),
  );

  const onPluginSelect = async (index: number, plugin: string) => {
    try {
      if (rubricData.criteria[index].plugin !== plugin) {
        const updatedCriteria = rubricData.criteria.map((criterion, idx) => {
          if (idx === index) {
            return {
              ...criterion,
              plugin: criterion.plugin === plugin ? undefined : plugin,
              configuration: undefined,
            };
          }
          return criterion;
        });

        await updateRubricMutation.mutateAsync({ criteria: updatedCriteria });
        onUpdate?.({ criteria: updatedCriteria });
      }
    } catch (error) {
      console.error("Error selecting plugin:", error);
      toast.error("Failed to select plugin. Please try again.");
    }
  };

  const handleConfig = (index: number, plugin: string | undefined) => {
    if (!plugin) {
      toast.warning("Plugin configuration not available.");
      return;
    }

    setSelectedCriterionIndex(index);
    setActivePluginConfigView(() => PluginConfigDialogs[plugin].view);
  };

  const handleConfigChange = async (config: string) => {
    if (selectedCriterionIndex === undefined) return;

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

      if (rubricData.criteria[selectedCriterionIndex].configuration !== config) {
        await updateRubricMutation.mutateAsync({ criteria: updatedCriteria });
        onUpdate?.({ criteria: updatedCriteria });
      }

      setSelectedCriterionIndex(undefined);
      setActivePluginConfigView(undefined);
      toast.success("Configure plugin successfully!");
    } catch (error) {
      console.error("Error updating Code Runner configuration:", error);
      toast.error("Failed to update Code Runner configuration. Please try again.");
    }
  };

  const handleCancel = () => {
    setSelectedCriterionIndex(undefined);
    setActivePluginConfigView(undefined);
  };

  if (ActivePluginConfigView && selectedCriterionIndex !== undefined)
    return (
      <ActivePluginConfigView
        configId={rubricData.criteria[selectedCriterionIndex].configuration}
        onCriterionConfigChange={handleConfigChange}
        onCancel={handleCancel}
      />
    );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Plugin Configuration</CardTitle>
        <CardDescription>Choose plugin for grading each criterion.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Criterion</TableHead>
                <TableHead className="w-[50%]">Plugin</TableHead>
                <TableHead className="w-[20%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rubricData.criteria.length === 0 ?
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground py-8"
                  >
                    No criteria in rubric
                  </TableCell>
                </TableRow>
              : rubricData.criteria.map((criterion, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{criterion.name}</TableCell>
                    <TableCell>
                      <Select
                        value={criterion.plugin || "ai"}
                        onValueChange={(value) => onPluginSelect(index, value)}
                        disabled={isLoading || updateRubricMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>{getPluginName(criterion.plugin)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {plugins.map((plugin) => (
                            <SelectItem key={plugin.id} value={plugin.id}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{plugin.name}</span>
                                {plugin.description && (
                                  <span className="text-xs text-muted-foreground">
                                    {plugin.description}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    {criterion.plugin &&
                      PluginConfigDialogs[criterion.plugin].enableConfig && (
                        <TableCell>
                          <Button
                            onClick={() => handleConfig(index, criterion.plugin)}
                            className="w-full"
                          >
                            Configure
                          </Button>
                        </TableCell>
                      )}
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default PluginConfiguration;
