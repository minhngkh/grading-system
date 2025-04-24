import { defineTypedService } from "@/utils/typed-moleculer";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import type { Context } from "moleculer";
import ApiService from "moleculer-web";
import { ZodParams } from "moleculer-zod-validator";
import { z } from "zod";

/**
 * Configuration interface for the AI Wrapper Service
 */
interface AIWrapperServiceSettings {
  openaiApiKey?: string;
  googleApiKey?: string;
}

// const geminiModels = ["gemini-2.0-flash", "gemini-2.0-flash-lite"] as const;
// type GeminiModel = (typeof geminiModels)[number];

// const openAiModels = ["gpt-4o-mini", "gpt-4o"] as const;
// type OpenAiModel = (typeof openAiModels)[number];

const supportedModels = {
  "gemini-2.0-flash": new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash"
  }),
  "gemini-2.0-flash-lite": new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite"
  }),
  "gpt-4o-mini": new ChatOpenAI({
    model: "gpt-4o-mini"
  }),
};

export type SupportedModels = keyof typeof supportedModels;

const callParams = new ZodParams({
  modelName: z.string(),
  systemPrompt: z.string().default("You are a helpful AI assistant."),
  prompt: z.string().min(1, "Prompt is required"),
  structuredOutput: z.boolean().optional().default(false),
});

const parser = new JsonOutputParser();

export const AIWrapperService = defineTypedService({
  name: "ai-wrapper",

  // Mix in the API Gateway service
  mixins: [ApiService],

  /**
   * Service settings
   */
  settings: {
    // API Gateway settings
    port: process.env.AI_API_PORT || 3000,
    routes: [
      {
        path: "/api",
        // Enable authentication if needed
        // authorization: true,
        aliases: {
          "POST /chat": "ai-wrapper.chat",
        },
        cors: {
          origin: "*",
          methods: ["GET", "OPTIONS", "POST"],
        },
      },
    ],

    // AI Service settings
    openaiApiKey: process.env.OPENAI_API_KEY,
    googleApiKey: process.env.GOOGLE_API_KEY,
  },

  /**
   * Service created lifecycle event handler
   */
  created() {
    // Validate API keys
    const settings = this.settings as AIWrapperServiceSettings;

    if (!settings.openaiApiKey) {
      this.logger.warn(
        "OpenAI API key is not set. OpenAI models will not work."
      );
    }

    if (!settings.googleApiKey) {
      this.logger.warn(
        "Google API key is not set. Gemini models will not work."
      );
    }
  },

  /**
   * Service methods
   */
  methods: {
    async processChat(
      modelName: string,
      systemPrompt: string,
      prompt: string,
      structuredOutput: boolean
    ) {
      try {
        // Validate model name and get the model instance
        if (!(modelName in supportedModels)) {
          throw new Error(`Model ${modelName} is not supported.`);
        }
        const model =
          supportedModels[modelName as keyof typeof supportedModels];

        const messages = [
          new SystemMessage(systemPrompt),
          new HumanMessage(prompt),
        ];

        if (structuredOutput) {
          try {
            // For structured output, we use LangChain's StructuredOutputParser
            // Create an enhanced system prompt instructing the model to respond with valid JSON
            const enhancedSystemPrompt = `${systemPrompt}\n\nYou must respond with a valid JSON Schema only, no markdown or any other text, just the raw json`;
            messages[0] = new SystemMessage(enhancedSystemPrompt);
            
            const response = await model.invoke(messages);

            const content = response.content.toString();

            try {
              // Try to parse the response as JSON
              return parser.parse(content);
            } catch (e) {
              this.logger.warn(
                "Failed to parse model response as JSON",
                content
              );
              return {
                error: "Failed to generate valid JSON",
                rawResponse: content,
              };
            }
          } catch (error) {
            this.logger.error("Error in structured output processing:", error);
            throw error;
          }
        } else {
          // Regular text response
          const response = await model.invoke(messages);

          return { result: response.content.toString() };
        }
      } catch (error) {
        this.logger.error("Error in chat processing:", error);
        throw error;
      }
    },
  },

  /**
   * Service actions
   */
  actions: {

    /**
     * Chat action to interact with AI models
     */
    chat: {
      params: callParams.schema,
      async handler(ctx: Context<typeof callParams.context>) {
        try {
          const {
            modelName,
            systemPrompt,
            prompt,
            structuredOutput = false,
          } = ctx.params;
          this.logger.info(`Processing chat request with model: ${modelName}`);

          const result = await this.processChat(
            modelName,
            systemPrompt,
            prompt,
            structuredOutput
          );

          return result;
        } catch (error) {
          this.logger.error("Error in chat action:", error);
          throw error;
        }
      },
    },
  },
});

export default AIWrapperService;
