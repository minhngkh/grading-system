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

export default function CodeRunnerConfigDialog({
  open,
  onOpenChange,
  onCriterionConfigChange,
}: PluginDialogConfigProps) {
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultConfig, setDefaultConfig] = useState<CodeRunnerConfig>({
    language: "",
    installCommand: "",
    runCommand: "",
    testCases: [],
    environmentVariables: {},
  });

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

  useEffect(() => {
    // Reset form to default config when dialog opens
    if (open) {
      reset(defaultConfig);
    }
  }, [open, reset, defaultConfig]);

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

    // Trigger validation for testCases field
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
    const token = await auth.getToken();
    if (!token) {
      return toast.error("You must be logged in to configure plugins.");
    }

    setIsSubmitting(true);
    try {
      // Validate the entire form
      const isValid = await trigger();

      if (!isValid) return setIsSubmitting(false);

      toast.success("Code Runner configuration saved successfully!");
      onCriterionConfigChange?.(JSON.stringify(config));
      onOpenChange?.(false);
      setDefaultConfig(config);
    } catch (error) {
      toast.error("Failed to save Code Runner configuration. Please try again.");
      console.error("Error saving Code Runner configuration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-2xl">
        <DialogHeader>
          <DialogTitle>Code Runner Plugin Configuration</DialogTitle>
          <DialogDescription>
            Configure the Code Runner plugin for this criterion. Specify the programming
            language, commands to install dependencies, and run the code. You can also
            define test cases and environment variables.
          </DialogDescription>
        </DialogHeader>

        <div className="p-2 max-h-[80vh] overflow-y-auto">
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
                          <SelectContent>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                            <SelectItem value="cpp">C++</SelectItem>
                            <SelectItem value="c">C</SelectItem>
                            <SelectItem value="csharp">C#</SelectItem>
                            <SelectItem value="go">Go</SelectItem>
                            <SelectItem value="rust">Rust</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="installCommand"
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
                  <p className="text-sm text-red-600">{errors.testCases.root.message}</p>
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
      </DialogContent>
    </Dialog>
  );
}
