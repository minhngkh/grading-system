import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import TestCasesTable from "./test-cases-table";

export default function CodeRunnerConfigView({
  configId,
  onCriterionConfigChange,
  onCancel,
}: PluginConfigProps) {
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    },
  });

  useEffect(() => {
    if (!isLoadingConfig && initialConfig) {
      form.reset(initialConfig);
    }
  }, [isLoadingConfig, initialConfig, form]);

  const {
    control,
    setValue,
    watch,
  } = form;

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
      if (!config.initCommand?.trim()) {
        toast.error("Install Dependencies Command is required");
        return;
      }
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
    <Card className="size-full">
      <CardHeader>
        <CardTitle>Test Runner Configuration</CardTitle>
        <CardDescription>
          Configure the Test Runner plugin for this criterion.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <Form {...form}>
          <form>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={control}
                  name="initCommand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Install Dependencies Command</FormLabel>
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

              <EnvironmentVariablesTable
                environmentVariables={config.environmentVariables ?? {}}
                onUpdateEnvVar={updateEnvVar}
                onDeleteEnvVar={deleteEnvVar}
              />
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-end gap-2">
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
