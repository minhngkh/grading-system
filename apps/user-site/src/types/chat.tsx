import type { Rubric } from "./rubric";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatResponse {
  content: string;
  done: boolean;
}