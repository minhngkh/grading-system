import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PluginDialogConfigProps } from "../type";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { CodeRunnerConfig, CodeRunnerConfigSchema } from "@/types/plugin";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EnvironmentVariablesTable from "./environment-variables-table";
import TestCasesTable from "./test-cases-table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createCodeRunnerConfigMutationOptions,
  getTestRunnerConfigQueryOptions,
  getTestRunnerSupportedLanguagesQueryOptions,
} from "@/queries/plugin-queries";
import { useMutation, useQuery } from "@tanstack/react-query";

export default function CodeRunnerConfigDialog({
  configId,
  open,
  onOpenChange,
  onCriterionConfigChange,
}: PluginDialogConfigProps) {
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultConfig, setDefaultConfig] = useState<CodeRunnerConfig>({
    language: "",
    initCommand: "",
    runCommand: "",
    testCases: [],
    environmentVariables: {},
  });

  const createConfigMutation = useMutation(createCodeRunnerConfigMutationOptions(auth));

  const { data: initialConfig, isLoading: isLoadingConfig } = useQuery(
    getTestRunnerConfigQueryOptions(configId!, auth, {
      staleTime: Infinity,
      enabled: !!configId,
    }),
  );

  useEffect(() => {
    if (!isLoadingConfig) return;

    if (initialConfig) {
      setDefaultConfig(initialConfig);
      reset(initialConfig);
    }
  }, [isLoadingConfig]);

  const {
    data: languages,
    isFetching: isFetchingLanguages,
    isError: isFetchingConfigError,
  } = useQuery(
    getTestRunnerSupportedLanguagesQueryOptions(auth, {
      staleTime: Infinity,
    }),
  );

  const form = useForm<CodeRunnerConfig>({
    resolver: zodResolver(CodeRunnerConfigSchema),
    defaultValues: defaultConfig,
  });

  const {
    control,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
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

    trigger("testCases");
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
      const isValid = await trigger();
      if (!isValid) return;

      const configId = await createConfigMutation.mutateAsync(config);
      onCriterionConfigChange?.(configId);
      setDefaultConfig(config);
    } catch (error) {
      toast.error("Failed to save Code Runner configuration. Please try again.");
      console.error("Error saving Code Runner configuration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange?.(open);
        reset(defaultConfig);
      }}
    >
      <DialogContent className="min-w-2xl">
        <DialogHeader>
          <DialogTitle>Test Runner Configuration</DialogTitle>
          <DialogDescription>
            Configure the Test Runner plugin for this criterion. Specify the programming
            language, commands to install dependencies, and run the code. You can also
            define test cases and environment variables.
          </DialogDescription>
        </DialogHeader>

        {isLoadingConfig ?
          <div className="p-4 text-center">Loading configuration...</div>
        : isFetchingConfigError ?
          <div className="p-4 text-red-600">
            Failed to load configuration. Please try again later.
          </div>
        : <>
            <div className="p-1 max-h-[80vh] overflow-y-auto">
              <Form {...form}>
                <form>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a language" />
                                </SelectTrigger>
                              </FormControl>
                              {isFetchingLanguages ?
                                <div>Loading languages...</div>
                              : <SelectContent>
                                  {languages?.map((lang) => (
                                    <SelectItem key={lang} value={lang}>
                                      {lang}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              }
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                    {errors.testCases && (
                      <p className="text-sm text-red-600">
                        {errors.testCases.message || errors.testCases.root?.message}
                      </p>
                    )}
                    {errors.testCases?.root && (
                      <p className="text-sm text-red-600">
                        {errors.testCases.root.message}
                      </p>
                    )}

                    <EnvironmentVariablesTable
                      environmentVariables={config.environmentVariables}
                      onUpdateEnvVar={updateEnvVar}
                      onDeleteEnvVar={deleteEnvVar}
                    />
                  </div>
                </form>
              </Form>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Confirm"}
              </Button>
            </DialogFooter>
          </>
        }
      </DialogContent>
    </Dialog>
  );
}
