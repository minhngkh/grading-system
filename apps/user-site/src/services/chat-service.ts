import {
  AgentChatResponse,
  ChatRubricSchema,
  UserChatPrompt,
  type RubricAgentResponse,
  type RubricUserPrompt,
} from "@/types/chat";
import axios from "axios";

const AI_PLUGIN_URL = `${import.meta.env.VITE_PLUGIN_SERVICE_URL}/api/v1/ai`;

export const sendRubricMessage = async (
  prompt: RubricUserPrompt,
): Promise<RubricAgentResponse> => {
  console.log(`Sending to ${AI_PLUGIN_URL}/rubric:`, prompt);
  const res = await axios.post(`${AI_PLUGIN_URL}/rubric`, prompt, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  return {
    message: res.data.message,
    rubric: res.data.rubric ? ChatRubricSchema.parse(res.data.rubric) : undefined,
  };
};

export const sendChatMessage = async (
  prompt: UserChatPrompt,
): Promise<AgentChatResponse> => {
  const res = await axios.post(`${AI_PLUGIN_URL}/chat`, prompt, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  return {
    message: res.data.message,
  };
};

export const uploadFile = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);

  // await axios.post(`${AI_PLUGIN_URL}/upload`, formData, {
  //   headers: {
  //     "Content-Type": "multipart/form-data",
  //   },
  // });
};
