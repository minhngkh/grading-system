import { UseMutationOptions } from "@tanstack/react-query";
import { ChatService } from "@/services/chat-service";
import {
  type ChatMessage,
  type AgentChatResponse,
  type RubricAgentResponse,
  ChatRubric,
} from "@/types/chat";
import { useAuth } from "@clerk/clerk-react";
import { Rubric } from "@/types/rubric";

type Auth = ReturnType<typeof useAuth>;

// Mutation options for sending a general chat message
export function sendChatMessageMutationOptions(
  auth: Auth,
  options?: Partial<UseMutationOptions<AgentChatResponse, unknown, ChatMessage[]>>,
): UseMutationOptions<AgentChatResponse, unknown, ChatMessage[]> {
  return {
    mutationFn: async (messages: ChatMessage[]) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return ChatService.sendChatMessage(messages, token);
    },
    ...options,
  };
}

// Mutation options for sending a rubric-based chat message
export function sendRubricMessageMutationOptions(
  rubric: Rubric,
  auth: Auth,
  options?: Partial<UseMutationOptions<RubricAgentResponse, unknown, ChatMessage[]>>,
): UseMutationOptions<RubricAgentResponse, unknown, ChatMessage[]> {
  return {
    mutationFn: async (messages: ChatMessage[]) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return ChatService.sendRubricMessage(messages, rubric as ChatRubric, token);
    },
    ...options,
  };
}
