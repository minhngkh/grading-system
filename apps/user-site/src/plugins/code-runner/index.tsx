import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import type { CodeRunnerConfig } from "@/types/plugin";
import {
  createCodeRunnerConfigMutationOptions,
  getTestRunnerConfigQueryOptions,
  updateCodeRunnerConfigMutationOptions,
} from "@/queries/plugin-queries";

import type { PluginConfigProps } from "../type";
import EnvironmentVariablesTable from "./environment-variables-table";
import OutputComparisonSettings from "./output-comparison-settings";
import RunningSettings from "./running-settings";
import TestCasesTable from "./test-cases-table";

export default function CodeRunnerConfigView({
  configId,
  onCriterionConfigChange,
  onCancel,
}: PluginConfigProps) {
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [envVarsOpen, setEnvVarsOpen] = useState(false);
  const [outputComparisonOpen, setOutputComparisonOpen] = useState(false);
  const [runningSettingsOpen, setRunningSettingsOpen] = useState(false);
  const createConfigMutation = useMutation(createCodeRunnerConfigMutationOptions(auth));

  const updateConfigMutation = useMutation(
    updateCodeRunnerConfigMutationOptions(configId || "", auth),
  );

  const { data: initialConfig, isLoading: isLoadingConfig } = useQuery(
    getTestRunnerConfigQueryOptions(configId!, auth, {
      retry: false,
      enabled: !!configId,
    }),
  );

  const form = useForm<CodeRunnerConfig>({
    defaultValues: {
      initCommand: "",
      runCommand: "",
      testCases: [],
      environmentVariables: {},
      advancedSettings: {
        initStep: {
          cpuLimit: 10 * 1000000000,
          memoryLimit: 256 * 1024 * 1024,
          procLimit: 50,
        },
        runStep: {
          cpuLimit: 10 * 1000000000,
          memoryLimit: 256 * 1024 * 1024,
          procLimit: 50,
        },
      },
      outputComparison: {
        ignoreWhitespace: false,
        ignoreLineEndings: false,
        trim: false,
        ignoreCase: false,
      },
    },
  });

  useEffect(() => {
    if (!isLoadingConfig && initialConfig) {
      form.reset(initialConfig);
    }
  }, [isLoadingConfig, initialConfig, form]);

  const { control, setValue, watch } = form;

  const config = watch();

  const updateCell = (
    index: number,
    field: "input" | "expectedOutput",
    value: string,
  ) => {
    const currentTestCases = config.testCases || [];

    if (index >= currentTestCases.length) {
      const newRow = { input: "", expectedOutput: "" };
      newRow[field] = value;
      setValue("testCases", [...currentTestCases, newRow]);
    } else {
      const updatedTestCases = currentTestCases.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      );
      setValue("testCases", updatedTestCases);
    }
  };

  const deleteRow = (index: number) => {
    const currentTestCases = config.testCases || [];
    if (index < currentTestCases.length) {
      setValue(
        "testCases",
        currentTestCases.filter((_, i) => i !== index),
      );
    }
  };

  const updateEnvVar = (index: number, field: "key" | "value", value: string) => {
    const envVars = Object.entries(config.environmentVariables || {});

    if (index >= envVars.length) {
      if (field === "key" && value.trim()) {
        setValue("environmentVariables", {
          ...config.environmentVariables,
          [value]: "",
        });
      }
    } else {
      const [oldKey, oldValue] = envVars[index];
      const newEnvVars = { ...config.environmentVariables };

      if (field === "key" && value !== oldKey) {
        delete newEnvVars[oldKey];
        if (value.trim()) {
          newEnvVars[value] = oldValue;
        }
      } else if (field === "value") {
        newEnvVars[oldKey] = value;
      }

      setValue("environmentVariables", newEnvVars);
    }
  };

  const deleteEnvVar = (index: number) => {
    const envVars = Object.entries(config.environmentVariables || {});
    if (index < envVars.length) {
      const [keyToDelete] = envVars[index];
      const newEnvVars = { ...config.environmentVariables };
      delete newEnvVars[keyToDelete];
      setValue("environmentVariables", newEnvVars);
    }
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Basic validation
      if (!config.runCommand?.trim()) {
        toast.error("Run Command is required");
        return;
      }
      if (!config.testCases || config.testCases.length === 0) {
        toast.error("At least one test case is required");
        return;
      }
      for (const testCase of config.testCases) {
        if (!testCase.input?.trim() || !testCase.expectedOutput?.trim()) {
          toast.error("All test cases must have both input and expected output");
          return;
        }
      }

      let resultConfigId: string;

      if (configId && initialConfig) {
        // Update existing config
        resultConfigId = await updateConfigMutation.mutateAsync(config);
      } else {
        // Create new config
        resultConfigId = await createConfigMutation.mutateAsync(config);
      }

      onCriterionConfigChange?.(resultConfigId);
    } catch (error) {
      toast.error("Failed to save Code Runner configuration. Please try again.");
      console.error("Error saving Code Runner configuration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Test Runner Configuration</CardTitle>
        <CardDescription>
          Configure the Test Runner plugin for this criterion.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 relative overflow-y-auto custom-scrollbar pr-0 mr-1">
        <div className="ml-6 mr-2 absolute top-0 left-0 right-0">
          <Form {...form}>
            <form>
              <div className="space-y-6">
                {/* Basic Settings - Always visible */}
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={control}
                    name="initCommand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Install Dependencies Command (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., npm install, pip install -r requirements.txt"
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="runCommand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Run Command</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., node main.js, python main.py"
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <TestCasesTable
                  testCases={config.testCases}
                  onUpdateCell={updateCell}
                  onDeleteRow={deleteRow}
                />

                <Collapsible open={envVarsOpen} onOpenChange={setEnvVarsOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="flex w-full justify-between p-0 h-auto">
                      <span className="text-base font-medium">
                        Environment Variables (Optional)
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${envVarsOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    <EnvironmentVariablesTable
                      environmentVariables={config.environmentVariables ?? {}}
                      onUpdateEnvVar={updateEnvVar}
                      onDeleteEnvVar={deleteEnvVar}
                    />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible
                  open={outputComparisonOpen}
                  onOpenChange={setOutputComparisonOpen}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex w-full justify-between p-0 h-auto">
                      <span className="text-base font-medium">
                        Output Comparison Settings
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${outputComparisonOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    <OutputComparisonSettings control={control} />
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible
                  open={runningSettingsOpen}
                  onOpenChange={setRunningSettingsOpen}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex w-full justify-between p-0 h-auto">
                      <span className="text-base font-medium">
                        Advanced Resource Limits
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${runningSettingsOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    <RunningSettings
                      control={control}
                      title="Initialization Step Limits"
                      description="Resource limits for the initialization/setup phase"
                      namePrefix="advancedSettings.initStep"
                    />

                    <RunningSettings
                      control={control}
                      title="Execution Step Limits"
                      description="Resource limits for the test execution phase"
                      namePrefix="advancedSettings.runStep"
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Confirm"}
        </Button>
      </CardFooter>
    </Card>
  );
}
