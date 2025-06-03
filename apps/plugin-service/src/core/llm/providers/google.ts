import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import type { LanguageModelV1ProviderMetadata } from "@ai-sdk/provider";
import process from "node:process";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { customProvider } from "ai";

const originalGoogle = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

export const google = customProvider({
  languageModels: {
    "gemini-2.0-flash-lite": originalGoogle("gemini-2.0-flash-lite"),
    "gemini-2.0-flash": originalGoogle("gemini-2.0-flash"),
    "gemini-2.5-flash-preview": originalGoogle("gemini-2.5-flash-preview-05-20"),
    "gemini-2.5-flash-preview:search": originalGoogle("gemini-2.5-flash-preview-05-20", {
      useSearchGrounding: true,
    }),
    "gemini-2.5-pro-preview": originalGoogle("gemini-2.5-pro-preview-05-06"),
  },
});

type ModelID = Parameters<typeof google.languageModel>[0];
type OptionsGenerator = (...args: any[]) => LanguageModelV1ProviderMetadata;

type GeminiThinkingOptions = {
  thinking:
    | {
        mode: "auto";
      }
    | {
        mode: "disabled";
      }
    | {
        mode: "enabled";
        level: "low" | "medium" | "high";
      };
};

const geminiThinkingOptionsGenerator: OptionsGenerator = (
  options: GeminiThinkingOptions,
) => {
  let thinkingOptions;
  switch (options.thinking.mode) {
    case "disabled":
      thinkingOptions = {
        thinkingBudget: 0,
      };
      break;
    case "auto":
      thinkingOptions = undefined;
      break;
    case "enabled":
      switch (options.thinking.level) {
        case "low":
          thinkingOptions = {
            thinkingBudget: 2048,
          };
          break;
        case "medium":
          thinkingOptions = {
            thinkingBudget: 8192,
          };
          break;
        case "high":
          thinkingOptions = {
            thinkingBudget: 24576,
          };
          break;
      }
      break;
  }

  return {
    google: {
      ...(thinkingOptions ? { thinkingConfig: thinkingOptions } : {}),
    } satisfies GoogleGenerativeAIProviderOptions,
  };
};

export const googleProviderOptions = {
  "gemini-2.5-flash-preview": geminiThinkingOptionsGenerator,
} satisfies Partial<Record<ModelID, OptionsGenerator>>;
