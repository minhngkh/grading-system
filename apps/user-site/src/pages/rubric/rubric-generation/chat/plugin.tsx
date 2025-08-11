import { useState } from "react";

import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import type { PluginComponent } from "@/plugins/type";
import type { Plugin } from "@/types/plugin";
import type { Rubric } from "@/types/rubric";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PluginConfigDialogs, PluginName } from "@/consts/plugins";
import { getAllPluginsQueryOptions } from "@/queries/plugin-queries";
import { PluginService } from "@/services/plugin-service";

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
  const [selectedCriterionIndex, setSelectedCriterionIndex] = useState<number>();
  const [ActivePluginConfigView, setActivePluginConfigView] = useState<
    PluginComponent | undefined
  >(undefined);
  
  // Local state to track criteria updates for immediate UI feedback
  const [localCriteria, setLocalCriteria] = useState(rubricData.criteria);
  
  // Track if the parent data has changed (new rubric loaded, etc.)
  const [lastRubricId, setLastRubricId] = useState(rubricData.id);
  const [lastCriteriaHash, setLastCriteriaHash] = useState(
    JSON.stringify(rubricData.criteria.map(c => ({ name: c.name, plugin: c.plugin, configuration: c.configuration })))
  );
  
  // Sync local state when switching rubrics or when criteria structure changes
  const currentCriteriaHash = JSON.stringify(
    rubricData.criteria.map(c => ({ name: c.name, plugin: c.plugin, configuration: c.configuration }))
  );
  
  if (rubricData.id !== lastRubricId || currentCriteriaHash !== lastCriteriaHash) {
    setLocalCriteria(rubricData.criteria);
    setLastRubricId(rubricData.id);
    setLastCriteriaHash(currentCriteriaHash);
  }

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

  const createDefaultConfig = async (pluginType: string): Promise<string | undefined> => {
    try {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication required");
      
      const configId = await PluginService.createDefaultConfig(pluginType, token);
      return configId;
    } catch (error) {
      console.error(`Error creating default config for ${pluginType}:`, error);
      return undefined;
    }
  };
  
  const onPluginSelect = async (index: number, plugin: string) => {
    try {
      if (localCriteria[index].plugin !== plugin) {
        // Check if the plugin has default configuration support
        const hasDefault = plugin !== "None" && PluginConfigDialogs[plugin]?.hasDefault;
        
        // Prepare configuration value - will be set to a default config ID if plugin supports it
        let configValue: string | undefined;
        
        // If plugin supports default configs, try to create one
        if (hasDefault) {
          configValue = await createDefaultConfig(plugin);
        }
        
        const updatedCriteria = localCriteria.map((criterion, idx) => {
          if (idx === index) {
            return {
              ...criterion,
              plugin,
              configuration: configValue,
            };
          }
          return criterion;
        });

        // Update local state immediately for UI feedback
        setLocalCriteria(updatedCriteria);
        
        // Update the parent rubric data to persist plugin changes
        if (onUpdate) {
          onUpdate({
            criteria: updatedCriteria,
          });
        }
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
      const updatedCriteria = localCriteria.map((criterion, idx) => {
        if (idx === selectedCriterionIndex) {
          return {
            ...criterion,
            configuration: config,
          };
        }
        return criterion;
      });

      // Update local state immediately for UI feedback
      setLocalCriteria(updatedCriteria);
      
      // Update the parent rubric data to persist configuration changes
      if (onUpdate) {
        onUpdate({
          criteria: updatedCriteria,
        });
      }

      setSelectedCriterionIndex(undefined);
      setActivePluginConfigView(undefined);
      toast.success("Configure plugin successfully!");
    } catch (error) {
      console.error("Error updating plugin configuration:", error);
      toast.error("Failed to update plugin configuration. Please try again.");
    }
  };

  const handleCancel = () => {
    setSelectedCriterionIndex(undefined);
    setActivePluginConfigView(undefined);
  };

  if (ActivePluginConfigView && selectedCriterionIndex !== undefined)
    return (
      <ActivePluginConfigView
        configId={localCriteria[selectedCriterionIndex].configuration}
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
              {localCriteria.length === 0 ?
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground py-8"
                  >
                    No criteria in rubric
                  </TableCell>
                </TableRow>
              : localCriteria.map((criterion, index) => (
                  <TableRow key={criterion.name || `criterion-${index}`}>
                    <TableCell className="font-medium">{criterion.name}</TableCell>
                    <TableCell>
                      <Select
                        value={criterion.plugin || "ai"}
                        onValueChange={(value) => onPluginSelect(index, value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full">
                          <div className="flex items-center justify-between w-full">
                            <SelectValue>{getPluginName(criterion.plugin)}</SelectValue>
                            {(criterion.plugin || "ai") && (criterion.plugin || "ai") !== "None" && 
                             (!criterion.configuration || criterion.configuration.trim().length === 0) && (
                              <div className="text-orange-500 ml-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
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
                    <TableCell>
                      {(criterion.plugin || "ai") &&
                        PluginConfigDialogs[criterion.plugin || "ai"]?.enableConfig && (
                          <Button
                            onClick={() => handleConfig(index, criterion.plugin || "ai")}
                            className="w-full"
                          >
                            Configure
                          </Button>
                        )}
                    </TableCell>
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
