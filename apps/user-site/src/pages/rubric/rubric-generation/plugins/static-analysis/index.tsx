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
import {
  StaticAnalysisConfig,
  StaticAnalysisConfigSchema,
  StaticAnalysisPreset,
  StaticAnalysisDeductionType,
} from "@/types/plugin";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createStaticAnalysisConfigMutationOptions,
  getStaticAnalysisConfigQueryOptions,
  updateStaticAnalysisConfigMutationOptions,
} from "@/queries/plugin-queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import DeductionMapTable from "./deduction-map-table";
import AdditionalRulesetsTable from "./additional-rulesets-table";

export default function StaticAnalysisConfigDialog({
  configId,
  open,
  onOpenChange,
  onCriterionConfigChange,
}: PluginDialogConfigProps) {
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultConfig, setDefaultConfig] = useState<StaticAnalysisConfig>({
    crossFileAnalysis: false,
    preset: StaticAnalysisPreset["Auto Detect"],
    additionalRulesets: [],
    deductionMap: {
      [StaticAnalysisDeductionType.critical]: 20,
      [StaticAnalysisDeductionType.error]: 15,
      [StaticAnalysisDeductionType.warning]: 2,
      [StaticAnalysisDeductionType.info]: 0,
    },
  });

  const createConfigMutation = useMutation(
    createStaticAnalysisConfigMutationOptions(auth),
  );

  const updateConfigMutation = useMutation(
    updateStaticAnalysisConfigMutationOptions(configId || "", auth),
  );

  const { data: initialConfig, isLoading: isLoadingConfig } = useQuery(
    getStaticAnalysisConfigQueryOptions(configId!, auth, {
      staleTime: Infinity,
      enabled: !!configId,
    }),
  );

  const form = useForm<StaticAnalysisConfig>({
    resolver: zodResolver(StaticAnalysisConfigSchema) as any,
    defaultValues: defaultConfig,
    mode: "onChange",
  });

  const {
    control,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (isLoadingConfig) return;

    if (initialConfig) {
      setDefaultConfig(initialConfig);
      reset(initialConfig);
    }
  }, [isLoadingConfig, initialConfig, reset]);

  const config = watch();

  const updateDeductionValue = (type: StaticAnalysisDeductionType, value: number) => {
    setValue("deductionMap", {
      ...config.deductionMap,
      [type]: value,
    });
    trigger("deductionMap");
  };

  const addRuleset = (ruleset: string) => {
    if (ruleset.trim() && !config.additionalRulesets?.includes(ruleset.trim())) {
      setValue("additionalRulesets", [
        ...(config.additionalRulesets || []),
        ruleset.trim(),
      ]);
    }
  };

  const removeRuleset = (index: number) => {
    const currentRulesets = config.additionalRulesets || [];
    setValue(
      "additionalRulesets",
      currentRulesets.filter((_, i) => i !== index),
    );
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      const isValid = await trigger();
      if (!isValid) return;

      let resultConfigId: string;

      if (configId && initialConfig) {
        resultConfigId = await updateConfigMutation.mutateAsync(config);
      } else {
        resultConfigId = await createConfigMutation.mutateAsync(config);
      }

      onCriterionConfigChange?.(resultConfigId);
      setDefaultConfig(config);
      onOpenChange?.(false);
    } catch (error) {
      toast.error("Failed to save Static Analysis configuration. Please try again.");
      console.error("Error saving Static Analysis configuration:", error);
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
          <DialogTitle>Static Analysis Configuration</DialogTitle>
          <DialogDescription>
            Configure the Static Analysis plugin for this criterion. Select the language
            preset, enable cross-file analysis, and define deduction rules for different
            issue types.
          </DialogDescription>
        </DialogHeader>

        <div className="p-1 max-h-[80vh] overflow-y-auto">
          <Form {...form}>
            <form>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={control as any}
                    name="preset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language Preset</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language preset" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(StaticAnalysisPreset).map(
                              ([label, value]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control as any}
                    name="crossFileAnalysis"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Cross-File Analysis</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enable analysis across multiple files in the project
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <DeductionMapTable
                  deductionMap={config.deductionMap}
                  onUpdateDeduction={updateDeductionValue}
                />
                {errors.deductionMap && (
                  <p className="text-sm text-red-600">{errors.deductionMap.message}</p>
                )}
                <AdditionalRulesetsTable
                  rulesets={config.additionalRulesets || []}
                  onAddRuleset={addRuleset}
                  onRemoveRuleset={removeRuleset}
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
