import type { ChatResponse } from "@/types/chat";
import type { Rubric } from "@/types/rubric";
import { RubricSchema } from "@/types/rubric";
import axios from "axios";

const AI_PLUGIN_URL = import.meta.env.VITE_AI_PLUGIN_URL;

const MOCK_RESPONSES = [
  // "I understand you want to create a rubric. Let me help you with that. A good rubric should include clear criteria, performance levels, and scoring guidelines.",
  // "Based on your request, I'll create a detailed rubric that covers: \n1) Learning objectives \n2) Assessment criteria \n3) Performance levels \n4) Scoring guidelines.",
  "To create an effective rubric, could you please provide: \n1) The assignment type \n2) Main learning objectives \n3) Expected skill level of students?",
];

const getRandomResponse = (): string => {
  const randomIndex = Math.floor(Math.random() * MOCK_RESPONSES.length);
  return MOCK_RESPONSES[randomIndex];
};

const getRubric = async (prompt: string) => {
  const res = await axios.post(`${AI_PLUGIN_URL}/rubric`, {
    prompt,
  });

  const rubric = RubricSchema.parse(res.data);

  return rubric;
};

type ResponseType =
  | {
      type: "chat";
      data: ReadableStream<ChatResponse>;
    }
  | {
      type: "rubric";
      data: Rubric;
    };

const MOCK_JUST_RUBRIC = true;

export const sendMessage = async (message: string): Promise<ResponseType> => {
  if (!MOCK_JUST_RUBRIC) {
    return {
      type: "chat",
      data: new ReadableStream({
        async start(controller) {
          const mockResponse = getRandomResponse();
          const words = mockResponse.split(" ");

          for (const word of words) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            controller.enqueue({ content: `${word} `, done: false });
          }

          controller.enqueue({ content: "", done: true });
          controller.close();
        },
      }),
    };
  }

  const rubric = await getRubric(message);
  
  return {
    type: "rubric",
    data: rubric,
  }
};

export const uploadFile = async (file: File): Promise<void> => {
  // TODO: Implement file upload logic
  console.log("Uploading file:", file);
};
