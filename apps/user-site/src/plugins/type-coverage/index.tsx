import type { PluginConfigProps } from "../type";
import type {
  TypeCoverageConfig} from "@/types/plugin";
import { useAuth } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  createTypeCoverageConfigMutationOptions,
  getTypeCoverageConfigQueryOptions,
  updateTypeCoverageConfigMutationOptions,
} from "@/queries/plugin-queries";
import {
  TypeCoverageConfigSchema,
} from "@/types/plugin";

export default function TypeCoverageConfigView({
  configId,
  onCriterionConfigChange,
  onCancel,
}: PluginConfigProps) {
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createConfigMutation = useMutation(
    createTypeCoverageConfigMutationOptions(auth),
  );

  const updateConfigMutation = useMutation(
    updateTypeCoverageConfigMutationOptions(configId || "", auth),
  );

  const { data: initialConfig, isLoading: isLoadingConfig } = useQuery(
    getTypeCoverageConfigQueryOptions(configId!, auth, {
      retry: false,
      enabled: !!configId,
    }),
  );

  const form = useForm<TypeCoverageConfig>({
    resolver: zodResolver(TypeCoverageConfigSchema) as any,
    defaultValues: {
      type: "type-coverage",
      version: 1,
      deductionMultiplier: 10,
    },
    mode: "onChange",
  });

  const {
    control,
    reset,
    trigger,
    watch,
  } = form;

  useEffect(() => {
    if (isLoadingConfig) return;

    if (initialConfig) {
      reset(initialConfig);
    }
  }, [isLoadingConfig, initialConfig, reset]);

  const config = watch();

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
    } catch (error) {
      toast.error("Failed to save Type Coverage configuration. Please try again.");
      console.error("Error saving Type Coverage configuration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Type Coverage Configuration</CardTitle>
        <CardDescription>
          Configure the Type Coverage plugin for this criterion
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 relative overflow-y-auto custom-scrollbar pr-0 mr-1">
        <div className="ml-6 mr-2 absolute top-0 left-0 right-0">
          <Form {...form}>
            <form>
              <div className="space-y-4">
                <FormField
                  control={control as any}
                  name="deductionMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deduction Multiplier</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      {/* <FormDescription>
                        Points deducted per percentage of missing type coverage. 
                        For example, with a multiplier of 10, if type coverage is 70%, 
                        30 points will be deducted (30% missing × 10).
                      </FormDescription> */}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-md border p-4 bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">How it works:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Type coverage is calculated as the percentage of code with type annotations</li>
                    <li>• The deduction is calculated as: (100% - Type Coverage%) × Deduction Multiplier</li>
                    <li>• Example: With 75% coverage and multiplier 10: (100% - 75%) × 10 = 25 points deducted</li>
                  </ul>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button onClick={onCancel} variant="outline" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Confirm"}
        </Button>
      </CardFooter>
    </Card>
  );
}
