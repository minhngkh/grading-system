import {
  AgentChatResponse,
  ChatMessage,
  ChatRubric,
  type RubricAgentResponse,
} from "@/types/chat";
import axios, { AxiosRequestConfig } from "axios";

const AI_PLUGIN_URL = `${import.meta.env.VITE_PLUGIN_SERVICE_URL}/api/v1/plugins/ai`;

export class ChatService {
  private static async buildHeaders(token: string): Promise<AxiosRequestConfig> {
    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
  }

  static async sendRubricMessage(
    messages: ChatMessage[],
    rubric: ChatRubric,
    token: string,
  ): Promise<RubricAgentResponse> {
    const formattedMessages = messages.map((message) => ({
      role: message.who === "user" ? "user" : "assistant",
      content: [
        {
          type: "text",
          text: message.message,
        },
        ...(message.files ?
          message.files.map((file) => ({
            type: "file",
            data: file.url,
            mimeType: file.type,
          }))
        : []),
      ],
    }));

    // Weight in range is a boolean, but the API expects it as a string, fix this later
    const data = {
      rubric: { ...rubric, weightInRange: "true" },
      messages: formattedMessages,
    };

    const configHeaders = await this.buildHeaders(token);
    const res = await axios.post(`${AI_PLUGIN_URL}/chat`, data, configHeaders);
    return {
      message: res.data.message,
      rubric: res.data.rubric ? res.data.rubric : undefined,
    };
  }

  static async sendChatMessage(
    messages: ChatMessage[],
    token: string,
  ): Promise<AgentChatResponse> {
    const formattedMessages = messages.map((message) => ({
      role: message.who === "user" ? "user" : "assistant",
      content: [
        {
          type: "text",
          text: message.message,
        },
        ...(message.files ?
          message.files.map((file) => ({
            type: "file",
            data: file.url,
            mimeType: file.type,
          }))
        : []),
      ],
    }));

    const data = JSON.stringify({
      messages: formattedMessages,
    });

    const configHeaders = await this.buildHeaders(token);
    const res = await axios.post(`${AI_PLUGIN_URL}/chat`, data, configHeaders);
    return {
      message: res.data.message,
    };
  }
}
