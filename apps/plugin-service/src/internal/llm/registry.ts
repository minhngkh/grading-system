import { createProviderRegistry } from "ai"
import { google } from "@/internal/llm/providers/google"
import { openai } from "@/internal/llm/providers/openai"

export const registry = createProviderRegistry({
  google,
  openai,
})