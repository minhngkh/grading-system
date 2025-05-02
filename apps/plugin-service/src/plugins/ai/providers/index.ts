import type { LlmClient } from "../types";
import type { GoogleModel } from "./google";
import type { OpenAIModel } from "./open-ai";
import { GoogleClient } from "./google";
import { OpenAIClient } from "./open-ai";

// Model aliases
export const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gpt-4o-mini",
] as const;

export type Model = (typeof MODELS)[number];

type ProviderInfo =
  | {
      provider: "google";
      actualModel: GoogleModel;
    }
  | {
      provider: "open-ai";
      actualModel: OpenAIModel;
    };

type ActualModels = { [model in Model]: ProviderInfo };
const actualModels: ActualModels = {
  "gemini-2.0-flash": {
    provider: "google",
    actualModel: "gemini-2.0-flash",
  },
  "gemini-2.5-flash": {
    provider: "google",
    actualModel: "gemini-2.5-flash",
  },
  "gpt-4o-mini": {
    provider: "open-ai",
    actualModel: "gpt-4o-mini",
  },
};

export function getClient(model: Model, systemPrompt?: string): LlmClient {
  const { provider, actualModel } = actualModels[model];

  switch (provider) {
    case "google":
      return new GoogleClient(actualModel, systemPrompt);
    case "open-ai":
      return new OpenAIClient(actualModel, systemPrompt);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
