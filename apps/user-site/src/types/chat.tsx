import { z } from "zod";
import { CriteriaSchema } from "./rubric";

export const ChatRubricSchema = z.object({
  rubricName: z.string(),
  tags: z.array(z.string()),
  criteria: z.array(CriteriaSchema),
});

export type ChatRubric = z.infer<typeof ChatRubricSchema>;

export interface RubricUserPrompt {
  prompt: string;
  rubric?: ChatRubric;
  files?: File[];
}

export interface RubricAgentResponse {
  message: string;
  rubric?: ChatRubric;
}

export interface UserChatPrompt {
  prompt: string;
  files?: File[];
}

export interface AgentChatResponse {
  message: string;
}

export type ChatMessage = {
  message: string;
  who: "user" | "agent";
  files?: UploadedFile[];
};

export type UploadedFile = {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
  url: string;
};
