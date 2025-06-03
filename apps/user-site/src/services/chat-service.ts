import {
  AgentChatResponse,
  ChatRubricSchema,
  UserChatPrompt,
  type RubricAgentResponse,
  type RubricUserPrompt,
} from "@/types/chat";
import axios, { AxiosRequestConfig } from "axios";

const AI_PLUGIN_URL = `${import.meta.env.VITE_PLUGIN_SERVICE_URL}/api/v1/ai`;

export class ChatService {
  static configHeaders: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  static async sendRubricMessage(prompt: RubricUserPrompt): Promise<RubricAgentResponse> {
    const res = await axios.post(`${AI_PLUGIN_URL}/rubric`, prompt, this.configHeaders);

    return {
      message: res.data.message,
      rubric: res.data.rubric ? ChatRubricSchema.parse(res.data.rubric) : undefined,
    };
  }

  static async sendChatMessage(prompt: UserChatPrompt): Promise<AgentChatResponse> {
    const res = await axios.post(`${AI_PLUGIN_URL}/chat`, prompt, this.configHeaders);

    return {
      message: res.data.message,
    };
  }
}
