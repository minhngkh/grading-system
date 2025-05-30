import { openai as originalOpenAI } from "@ai-sdk/openai";
import { customProvider } from "ai";

export const openai = customProvider({
  languageModels: {
    "gpt-4o-mini": originalOpenAI("gpt-4o-mini"),
  },
});
