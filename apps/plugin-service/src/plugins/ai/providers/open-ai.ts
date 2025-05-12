import type { z, ZodType } from "zod";
import type { LlmClient } from "../types";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

const MODELS = ["gpt-4o-mini", "o3-mini", "o4-mini", "gpt-4.1-nano"] as const;
type Model = (typeof MODELS)[number];

type Clients = { [K in Model]: ChatOpenAI };

const clients: Clients = {
  "gpt-4o-mini": new ChatOpenAI({
    model: "gpt-4o-mini",
  }),
  "o3-mini": new ChatOpenAI({
    model: "o3-mini",
  }),
  "o4-mini": new ChatOpenAI({
    model: "o4-mini",
  }),
  "gpt-4.1-nano": new ChatOpenAI({
    model: "gpt-4.1-nano",
  }),
};

class Client implements LlmClient {
  private client: ChatOpenAI;
  private systemPrompt: string | null;

  constructor(model: Model, systemPrompt?: string) {
    this.client = clients[model];
    this.systemPrompt = systemPrompt || null;
  }

  // Overloads
  async generate(prompt: string): Promise<string>;
  async generate<T extends ZodType>(
    prompt: string,
    outputStructure: T,
    outputStructureAlias?: string,
  ): Promise<z.infer<T>>;

  async generate<T extends ZodType>(
    prompt: string,
    outputStructure?: T,
    outputStructureAlias?: string,
  ): Promise<string | z.infer<T>> {
    const messages = [];
    if (this.systemPrompt) {
      messages.push(new SystemMessage(this.systemPrompt));
    }
    messages.push(new HumanMessage(prompt));

    if (!outputStructure) {
      const response = await this.client.invoke(prompt);
      return response.content as string;
    }

    const response = await this.client
      .withStructuredOutput(
        outputStructure,
        outputStructureAlias ? { name: outputStructureAlias } : {},
      )
      .invoke(messages);

    return response as z.infer<T>;
  }
}

export {
  MODELS as OPEN_AI_MODELS,
  Client as OpenAIClient,
  type Model as OpenAIModel,
};
