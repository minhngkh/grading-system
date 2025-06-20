import {
  AgentChatResponse,
  ChatMessage,
  ChatRubric,
  type RubricAgentResponse,
} from "@/types/chat";
import axios, { AxiosRequestConfig } from "axios";

const AI_PLUGIN_URL = `${import.meta.env.VITE_PLUGIN_SERVICE_URL}/api/v1/plugins/ai`;

export class ChatService {
  static configHeaders: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  static async sendRubricMessage(
    messages: ChatMessage[],
    rubric?: ChatRubric,
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

    const data = {
      rubric: rubric,
      messages: formattedMessages,
    };

    const res = await axios.post(`${AI_PLUGIN_URL}/chat`, data, this.configHeaders);
    return {
      message: res.data.message,
      // TODO: Handle rubric schema validation
      rubric: res.data.rubric ? res.data.rubric : undefined,
    };
  }

  static async sendChatMessage(messages: ChatMessage[]): Promise<AgentChatResponse> {
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

    const res = await axios.post(`${AI_PLUGIN_URL}/chat`, data, this.configHeaders);
    return {
      message: res.data.message,
    };
  }
}
