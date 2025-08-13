import { z } from "zod";

const models = [
  "openai:gpt-4.1-mini",
  "openai:gpt-5-mini",
  "openai:gpt-5-nano",
  "google:gemini-2.5-flash",
  "google:gemini-2.5-flash:search",
  "google:gemini-2.5-pro",
] as const;

export type AIModel = (typeof models)[number];

type ModelsInfo = {
  [key: string]: {
    model: AIModel;
    provider: string;
    description: string;
  };
};

const predefinedModels: ModelsInfo = {
  "GPT-4.1 Mini": {
    model: "openai:gpt-4.1-mini",
    provider: "openai",
    description:
      "Fast, cost-efficient GPT-4.1 tier for general grading, summarization and light reasoning tasks.",
  },
  "GPT-5 Mini": {
    model: "openai:gpt-5-mini",
    provider: "openai",
    description:
      "Next-gen compact model with stronger reasoning and longer context than 4.1 Mini while keeping low latency.",
  },
  "GPT-5 Nano": {
    model: "openai:gpt-5-nano",
    provider: "openai",
    description:
      "Ultra-light, very low cost & latency; best for simple extraction, classification and quick scoring heuristics.",
  },
  "Gemini 2.5 Flash": {
    model: "google:gemini-2.5-flash",
    provider: "google",
    description:
      "Speed-optimized Gemini variant for high-throughput grading and basic multimodal (text/image) understanding.",
  },
  "Gemini 2.5 Flash (with Search)": {
    model: "google:gemini-2.5-flash:search",
    provider: "google",
    description:
      "Flash model augmented with Google Search grounding for fresher factual/contextual grading references.",
  },
  "Gemini 2.5 Pro": {
    model: "google:gemini-2.5-pro",
    provider: "google",
    description:
      "Full capability Gemini tier for complex reasoning, nuanced rubric alignment and richer multimodal inputs.",
  },
} as const;

export const aiConfigSchema = z.object({
  type: z.literal("ai"),
  version: z.literal(1).default(1),
  model: z.enum(models).describe("AI model to use").default("google:gemini-2.5-flash"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .default(1)
    .describe("Controls randomness in model responses (0-2)"),
});

export type AiConfig = z.infer<typeof aiConfigSchema>;
