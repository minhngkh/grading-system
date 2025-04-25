import { ChatResponse } from "@/types/chat";

const MOCK_RESPONSES = [
  "I understand you want to create a rubric. Let me help you with that. A good rubric should include clear criteria, performance levels, and scoring guidelines.",
  "Based on your request, I'll create a detailed rubric that covers: \n1) Learning objectives \n2) Assessment criteria \n3) Performance levels \n4) Scoring guidelines.",
  "To create an effective rubric, could you please provide: \n1) The assignment type \n2) Main learning objectives \n3) Expected skill level of students?",
];

const getRandomResponse = (): string => {
  const randomIndex = Math.floor(Math.random() * MOCK_RESPONSES.length);
  return MOCK_RESPONSES[randomIndex];
};

export const sendMessage = async (
  message: string
): Promise<ReadableStream<ChatResponse>> => {
  message = "";
  return new ReadableStream({
    async start(controller) {
      const mockResponse = getRandomResponse();
      const words = mockResponse.split(" ");

      for (const word of words) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        controller.enqueue({ content: word + " ", done: false });
      }

      controller.enqueue({ content: "", done: true });
      controller.close();
    },
  });
};

export const uploadFile = async (file: File): Promise<void> => {
  // TODO: Implement file upload logic
  console.log("Uploading file:", file);
};
