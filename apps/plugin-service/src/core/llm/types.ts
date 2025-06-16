import type { LanguageModel, ProviderMetadata } from "ai";

export type LanguageModelWithOptions = {
  model: LanguageModel;
  providerOptions?: ProviderMetadata;
};
