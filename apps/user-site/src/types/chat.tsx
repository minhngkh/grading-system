import type { Rubric } from "./rubric";

export interface UserPrompt {
  prompt: string;
  rubric?: Rubric;
}

export interface AgentResponse {
  message: string;
  rubric?: Rubric;
}
