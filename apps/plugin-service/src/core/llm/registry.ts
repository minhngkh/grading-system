import { createProviderRegistry } from "ai"
import { google } from "@/core/llm/providers/google"
import { openai } from "@/core/llm/providers/openai"

export const registry = createProviderRegistry({
  google,
  openai,
})