import "dotenv/config";

import type { CoreMessage } from "ai";
import type { Rubric } from "./core";
import { describe, expect, it } from "vitest";
import { generateChatResponse, gradeUsingRubric } from "./core";

function createMessage(prompt: string): CoreMessage {
  return {
    role: "user",
    content: prompt,
  };
}

describe.concurrent("test ai plugin", () => {
  const sampleRubricPrompt = `
    Create a rubric for evaluating code quality with the following criteria:
    - Code Flow: How well the code is structured and flows logically
    - Code Style: How readable and well-formatted the code is
    - Error Handling: How well the code handles potential errors
    `;
  const sampleGeneralQuestion = `
    What is the difference between formative and summative assessment?
  `;
  const sampleCode = `
    function calculateSum(numbers) {
      let sum = 0;
      for(let i = 0; i < numbers.length; i++) {
          sum += numbers[i];
      }
      return sum;
    }
    `;

  const sampleRubric: Rubric = {
    criteria: [
      {
        levels: [
          {
            description:
              "Code is well-structured with clear and logical flow. Easy to follow and understand.",
            tag: "3",
            weight: {
              max: 100,
              min: 75,
            },
          },
          {
            description:
              "Code is generally well-structured, but some areas could be improved for better flow.",
            tag: "2",
            weight: {
              max: 75,
              min: 50,
            },
          },
          {
            description:
              "Code structure is somewhat confusing or inconsistent. Difficult to follow in places.",
            tag: "1",
            weight: {
              max: 50,
              min: 25,
            },
          },
          {
            description:
              "Code has no discernible structure. Nearly impossible to understand.",
            tag: "0",
            weight: {
              max: 25,
              min: 0,
            },
          },
        ],
        name: "Code Flow",
        weight: 30,
      },
      {
        levels: [
          {
            description:
              "Code is exceptionally readable, with consistent formatting and clear naming conventions.",
            tag: "3",
            weight: {
              max: 100,
              min: 75,
            },
          },
          {
            description:
              "Code is mostly readable, with minor inconsistencies in formatting or naming.",
            tag: "2",
            weight: {
              max: 75,
              min: 50,
            },
          },
          {
            description:
              "Code is difficult to read due to poor formatting, inconsistent naming, or lack of comments.",
            tag: "1",
            weight: {
              max: 50,
              min: 25,
            },
          },
          {
            description:
              "Code is unreadable. No attention has been paid to formatting or style.",
            tag: "0",
            weight: {
              max: 25,
              min: 0,
            },
          },
        ],
        name: "Code Style",
        weight: 30,
      },
      {
        levels: [
          {
            description:
              "Code anticipates potential errors and handles them gracefully. Comprehensive error handling is implemented.",
            tag: "3",
            weight: {
              max: 100,
              min: 75,
            },
          },
          {
            description:
              "Code handles some errors, but there are gaps in error handling coverage.",
            tag: "2",
            weight: {
              max: 75,
              min: 50,
            },
          },
          {
            description:
              "Code has minimal error handling. Many potential errors are not addressed.",
            tag: "1",
            weight: {
              max: 50,
              min: 25,
            },
          },
          {
            description:
              "Code lacks any error handling. Will likely crash or produce incorrect results when errors occur.",
            tag: "0",
            weight: {
              max: 25,
              min: 0,
            },
          },
        ],
        name: "Error Handling",
        weight: 40,
      },
    ],
    weightInRange: "true",
    rubricName: "Code Quality Rubric",
    tags: ["0", "1", "2", "3"],
  };

  it("grade using sample rubric directly", async () => {
    const result = await gradeUsingRubric(sampleRubric, sampleCode);
    if (result.isErr()) {
      throw result.error;
    }
  });

  it("generate rubric then grade it directly", async () => {
    const chatResponseResult = await generateChatResponse({
      messages: [createMessage(sampleRubricPrompt)],
    });
    if (chatResponseResult.isErr()) {
      throw chatResponseResult.error;
    }

    const chatResponse = chatResponseResult.value;

    if (chatResponse.stream) {
      throw new Error("Rubric generation returned a stream, expected a rubric object");
    }

    if (!chatResponse.result.rubric) {
      throw new Error("Rubric is null or undefined");
    }
    const result = await gradeUsingRubric(chatResponse.result.rubric, sampleCode);
    if (result.isErr()) {
      throw result.error;
    }
  });

  it("ask general question", async () => {
    const chatResult = await generateChatResponse({
      messages: [createMessage(sampleGeneralQuestion)],
    });
    if (chatResult.isErr()) {
      throw chatResult.error;
    }

    const chatResponse = chatResult.value;
    if (chatResponse.stream) {
      throw new Error("Expected a non-stream response for general question");
    }

    const { message, rubric } = chatResponse.result;

    expect(typeof message).toBe("string");
    expect(rubric).toBeNull();
  });
});
