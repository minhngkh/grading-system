import { z } from "zod";
import { CriteriaSchema } from "./rubric";

export const ChatRubricSchema = z.object({
  name: z.string().min(1, "Rubric name is required"),
  tags: z.array(z.string()),
  criteria: z.array(CriteriaSchema),
});

export interface RubricUserPrompt {
  prompt: string;
  rubric?: z.infer<typeof ChatRubricSchema>;
  files?: File[];
}

export interface RubricAgentResponse {
  message: string;
  rubric?: z.infer<typeof ChatRubricSchema>;
}

export interface UserChatPrompt {
  prompt: string;
  files?: File[];
}

export interface AgentChatResponse {
  message: string;
}
