import { ChatRubricSchema, type AgentResponse, type UserPrompt } from "@/types/chat";
import axios from "axios";

const AI_PLUGIN_URL = import.meta.env.VITE_AI_PLUGIN_URL;

export const sendMessage = async (prompt: UserPrompt): Promise<AgentResponse> => {
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

export const uploadFile = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);

  // await axios.post(`${AI_PLUGIN_URL}/upload`, formData, {
  //   headers: {
  //     "Content-Type": "multipart/form-data",
  //   },
  // });
};
