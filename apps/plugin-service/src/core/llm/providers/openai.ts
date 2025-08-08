import process from "node:process";
import { createOpenAI } from "@ai-sdk/openai";
import { customProvider } from "ai";

const originalOpenAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = customProvider({
  languageModels: {
    "gpt-4o-mini": originalOpenAI("gpt-4o-mini"),
    "o4-mini": originalOpenAI("o4-mini"),
    "gpt-4.1-mini": originalOpenAI("gpt-4.1-mini"),
  },
});
