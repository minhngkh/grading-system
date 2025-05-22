import { z } from "zod";
import { CriteriaSchema } from "./rubric";

export const ChatRubricSchema = z.object({
  rubricName: z.string().min(1, "Rubric name is required"),
  tags: z.array(z.string()),
  criteria: z.array(CriteriaSchema),
});

export interface UserPrompt {
  prompt: string;
  rubric?: z.infer<typeof ChatRubricSchema>;
}

export interface AgentResponse {
  message: string;
  rubric?: z.infer<typeof ChatRubricSchema>;
}
