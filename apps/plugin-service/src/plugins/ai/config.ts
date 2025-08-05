import { z } from "zod";

const models = [
  "openai:gpt-4o-mini",
  "openai:o4-mini",
  "openai:gpt-4.1-mini",
  "google:gemini-2.5-flash",
  "google:gemini-2.5-flash:search",
  "google:gemini-2.5-pro",
] as const;

type Models = {
  [key: string]: {
    model: (typeof models)[number];
    provider: string;
    description: string;
  };
};

const predefinedModels: Models = {
  "GPT-4o Mini": {
    model: "openai:gpt-4o-mini",
    provider: "openai",
    description: "Faster and more cost-effective OpenAI model",
  },
  "O4 Mini": {
    model: "openai:o4-mini",
    provider: "openai",
    description: "Optimized OpenAI model for speed and cost",
  },
  "GPT-4.1 Mini": {
    model: "openai:gpt-4.1-mini",
    provider: "openai",
    description: "Latest OpenAI model with improved performance",
  },
  "Gemini 2.5 Flash": {
    model: "google:gemini-2.5-flash",
    provider: "google",
    description: "Gemini 2.5 Flash with advanced capabilities",
  },
  "Gemini 2.5 Flash (with Search)": {
    model: "google:gemini-2.5-flash:search",
    provider: "google",
    description: "Gemini 2.5 Flash with search grounding enabled",
  },
  "Gemini 2.5 Pro": {
    model: "google:gemini-2.5-pro",
    provider: "google",
    description: "Gemini 2.5 Pro with enhanced reasoning",
  },
} as const;

export const aiConfigSchema = z.object({
  type: z.literal("ai"),
  version: z.literal(1).default(1),
  model: z.enum(models).describe("Predefined AI model to use for grading"),
  // temperature: z
  //   .number()
  //   .min(0)
  //   .max(2)
  //   .default(0.3)
  //   .describe("Controls randomness in model responses (0-2)"),
});

export type AiConfig = z.infer<typeof aiConfigSchema>;
