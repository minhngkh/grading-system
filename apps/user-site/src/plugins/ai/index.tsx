import { useAuth } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { PluginConfigProps } from "../type";
import type { AIConfig } from "@/types/plugin";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  createAIConfigMutationOptions,
  getAIConfigQueryOptions,
  updateAIConfigMutationOptions,
} from "@/queries/plugin-queries";
import { AIConfigSchema, AIModel } from "@/types/plugin";

const modelDescriptions: Record<string, { provider: string; description: string }> = {
  [AIModel["GPT-4.1 Mini"]]: {
    provider: "OpenAI",
    description: "Fast, cost-efficient GPT-4.1 tier for general grading, summarization and light reasoning tasks.",
  },
  [AIModel["GPT-5 Mini"]]: {
    provider: "OpenAI",
    description: "Next-gen compact model with stronger reasoning and longer context than 4.1 Mini while keeping low latency.",
  },
  [AIModel["GPT-5 Nano"]]: {
    provider: "OpenAI",
    description: "Ultra-light, very low cost & latency; best for simple extraction, classification and quick scoring heuristics.",
  },
  [AIModel["Gemini 2.5 Flash"]]: {
    provider: "Google",
    description: "Speed-optimized Gemini variant for high-throughput grading and basic multimodal (text/image) understanding.",
  },
  [AIModel["Gemini 2.5 Flash (with Search)"]]: {
    provider: "Google",
    description: "Flash model augmented with Google Search grounding for fresher factual/contextual grading references.",
  },
  [AIModel["Gemini 2.5 Pro"]]: {
    provider: "Google",
    description: "Full capability Gemini tier for complex reasoning, nuanced rubric alignment and richer multimodal inputs.",
  },
};

export default function AIConfigView({
  configId,
  onCriterionConfigChange,
  onCancel,
}: PluginConfigProps) {
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createConfigMutation = useMutation(createAIConfigMutationOptions(auth));

  const updateConfigMutation = useMutation(
    updateAIConfigMutationOptions(configId || "", auth),
  );

  const { data: initialConfig, isLoading: isLoadingConfig } = useQuery(
    getAIConfigQueryOptions(configId!, auth, {
      retry: false,
      enabled: !!configId,
    }),
  );

  const form = useForm<AIConfig>({
    resolver: zodResolver(AIConfigSchema) as any,
    defaultValues: {
      type: "ai",
      version: 1,
      model: AIModel["Gemini 2.5 Flash"],
      temperature: 1,
    },
    mode: "onChange",
  });

  const {
    control,
    watch,
    trigger,
    reset,
  } = form;

  useEffect(() => {
    if (isLoadingConfig) return;

    if (initialConfig) {
      reset(initialConfig);
    }
  }, [isLoadingConfig, initialConfig, reset]);

  const config = watch();
  const selectedModel = config.model;

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
      toast.error("Failed to save AI configuration. Please try again.");
      console.error("Error saving AI configuration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingConfig) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading AI configuration...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
        <CardDescription>
          Configure the AI plugin for this criterion. Select the AI model and adjust the
          temperature to control response randomness.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 relative overflow-y-auto custom-scrollbar pr-0 mr-1">
        <div className="ml-6 mr-2 absolute top-0 left-0 right-0">
          <Form {...form}>
            <form>
              <div className="space-y-6">
                <FormField
                  control={control as any}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Model</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an AI model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(AIModel).map(([label, value]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {modelDescriptions[value]?.provider}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedModel && modelDescriptions[selectedModel] && (
                        <FormDescription className="text-sm">
                          {modelDescriptions[selectedModel].description}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control as any}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Temperature: {field.value.toFixed(1)}
                      </FormLabel>
                      <FormControl>
                        <div className="px-3">
                          <Slider
                            min={0}
                            max={2}
                            step={0.1}
                            value={[field.value]}
                            onValueChange={(values: number[]) => field.onChange(values[0])}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0.0 - Focused</span>
                            <span>1.0 - Balanced</span>
                            <span>2.0 - Creative</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Controls randomness in model responses. Lower values (0.0-0.3) produce more
                        focused and deterministic outputs, while higher values (1.5-2.0) increase
                        creativity and variability.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
