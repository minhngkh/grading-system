import type { ZodType } from "zod";
import type { LlmClient } from "../types";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
] as const;

type Model = (typeof MODELS)[number];

type Clients = { [K in Model]: ChatGoogleGenerativeAI };

const clients: Clients = {
  "gemini-2.0-flash": new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
  }),
  "gemini-2.0-flash-lite": new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
  }),
  "gemini-2.5-flash": new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-preview-04-17",
  }),
  "gemini-2.5-pro": new ChatGoogleGenerativeAI({
    model: "gemini-2.5-pro-preview-03-25",
  }),
};

class Client implements LlmClient {
  private client: ChatGoogleGenerativeAI;
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
        z.object({ response: outputStructure }),
        outputStructureAlias ? { name: outputStructureAlias } : {},
      )
      .invoke(messages);

    return response.response as z.infer<T>;
  }
}

export {
  MODELS as GOOGLE_MODELS,
  Client as GoogleClient,
  type Model as GoogleModel,
};
