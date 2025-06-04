import type { Rubric } from "@/utils";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { createSystemPrompt, getFile, getPath, getText, resultSchema } from "@/utils";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const modelOptions = {
  model: google("gemini-2.5-flash-preview-04-17"),
  providerOptions: {
    google: {
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  },
};

const rubrics = {
  code: {
    simple: JSON.parse(getText("rubric/simple_coding_rubric.json")) as Rubric,
    complex: JSON.parse(getText("rubric/complex_coding_rubric.json")) as Rubric,
  },
  report: {
    simple: JSON.parse(getText("rubric/simple_report_rubric.json")) as Rubric,
    complex: JSON.parse(getText("rubric/complex_report_rubric.json")) as Rubric,
  },
};

const files = {
  code: {
    normal: {
      text: getText("code/normal_code.py"),
      handWritten: getFile("image/Code image.pdf"),
      images: [getFile("image/Normal.png")],
      pdf: getFile("pdf/normal_code.pdf"),
    },
    complex: {
      text: getText("code/complex_code.py"),
      images: [
        getFile("image/complex_1.png"),
        getFile("image/complex_2.png"),
        getFile("image/complex_3.png"),
      ],
      pdf: getFile("pdf/complex_code.pdf"),
    },
  },
  report: getFile("pdf/report.pdf"),
  reportPart: getFile("pdf/report-1.pdf"),
};

const codeTopic =
  "The topic of the code is: Download the HTML content of a webpage and save it to a file";
const gradeCode = {
  "normal.text": (rubric: Rubric) => {
    return generateObject({
      ...modelOptions,
      prompt: files.code.normal.text,
      system: createSystemPrompt(rubric, codeTopic),
      schema: resultSchema,
    });
  },
  "normal.handWritten": (rubric: Rubric) => {
    return generateObject({
      ...modelOptions,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              filename: "hand_written_code.pdf",
              data: files.code.normal.handWritten,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      system: createSystemPrompt(rubric, codeTopic),
      schema: resultSchema,
    });
  },
  "normal.images": (rubric: Rubric) => {
    return generateObject({
      ...modelOptions,
      messages: [
        {
          role: "user",
          content: files.code.normal.images.map((image, idx) => ({
            // type: "file",
            // data: image,
            // filename: `normal_code_${idx}.png`,
            // mimeType: "image/png",
            type: "image",
            image,
            mimeType: "image/png",
          })),
        },
      ],
      system: createSystemPrompt(rubric, codeTopic),
      schema: resultSchema,
    });
  },
  "normal.images.v2": (rubric: Rubric) => {
    return generateObject({
      ...modelOptions,
      messages: [
        {
          role: "user",
          content: files.code.normal.images.map((image, idx) => ({
            type: "file",
            data: image,
            filename: `normal_code_${idx}.png`,
            mimeType: "image/png",
            // type: "image",
            // image,
            // mimeType: "image/png",
          })),
        },
      ],
      system: createSystemPrompt(rubric, codeTopic),
      schema: resultSchema,
    });
  },
  "normal.pdf": (rubric: Rubric) => {
    return generateObject({
      ...modelOptions,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              filename: "code.pdf",
              data: files.code.normal.pdf,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      system: createSystemPrompt(rubric, codeTopic),
      schema: resultSchema,
    });
  },
  "complex.text": (rubric: Rubric) => {
    return generateObject({
      ...modelOptions,
      prompt: files.code.complex.text,
      system: createSystemPrompt(rubric, codeTopic),
      schema: resultSchema,
    });
  },
  "complex.images": (rubric: Rubric) => {
    return generateObject({
      ...modelOptions,
      messages: [
        {
          role: "user",
          content: files.code.complex.images.map((image, idx) => ({
            type: "file",
            data: image,
            filename: `complex_code_${idx}.png`,
            mimeType: "image/png",
          })),
        },
      ],
      system: createSystemPrompt(rubric, codeTopic),
      schema: resultSchema,
    });
  },
  "complex.pdf": (rubric: Rubric) => {
    return generateObject({
      ...modelOptions,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              filename: "complex_code.pdf",
              data: files.code.complex.pdf,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      system: createSystemPrompt(rubric, codeTopic),
      schema: resultSchema,
    });
  },

  "pdf.part.prompt": (rubric: Rubric) => {
    return generateObject({
      ...modelOptions,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              filename: "report.pdf",
              data: files.report,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      system: createSystemPrompt(
        rubric,
        `${codeTopic}\nOnly grade section 1 (Giới thiệu) and section 2 (Các con số thống kê) for me`,
      ),
      schema: resultSchema,
    });
  },
  "pdf.part.manual": (rubric: Rubric) => {
    return generateObject({
      ...modelOptions,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              filename: "report.pdf",
              data: files.reportPart,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      system: createSystemPrompt(rubric),
      schema: resultSchema,
    });
  },
};

const reportTopic =
  "The topic of the report is: Phân tích và trực quan số liệu nhà ở tại thủ đô Hà Nội";
const gradeReport = (rubric: Rubric) => {
  return generateObject({
    ...modelOptions,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            filename: `report.pdf`,
            data: files.report,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    system: createSystemPrompt(rubric, reportTopic),
    schema: resultSchema,
  });
};

function addRow(path: string, data: string[]) {
  const row = `${data.join(",")}\n`;
  appendFileSync(path, row, "utf-8");
}

const ITERATIONS = 120;

async function main() {
  const resultsPath = getPath("results.csv");
  if (!existsSync(resultsPath)) {
    writeFileSync(resultsPath, "type,name,rubric,score\n", "utf-8");
  }

  const toRun: (keyof typeof gradeCode)[] = ["pdf.part.manual"];

  const promises: Promise<void>[] = [];

  const rubricType: keyof typeof rubrics.code = "complex";
  const rubric = rubrics.report[rubricType];
  // for (const [rubricType, rubric] of Object.entries(rubrics.code)) {
  for (const key of toRun) {
    for (let i = 0; i < ITERATIONS; i++) {
      if (Object.prototype.hasOwnProperty.call(gradeCode, key)) {
        promises.push(
          (async () => {
            try {
              const gradeFunction = gradeCode[key as keyof typeof gradeCode];
              const { object } = await gradeFunction(rubric);

              const totalScore = Math.round(
                object.results.reduce((acc, criterion) => {
                  const weight = rubric.criteria.find(
                    (c) => c.name === criterion.criterion,
                  );
                  if (weight === undefined) {
                    console.error(
                      `${i}/${ITERATIONS}: Error ${key} - ${rubricType}:`,
                      object,
                    );

                    throw new Error(
                      `Criterion ${criterion.criterion} not found in rubric ${rubricType}`,
                    );
                  }

                  return acc + criterion.score;
                }, 0),
              );

              addRow(resultsPath, ["report", key, rubricType, totalScore.toString()]);
              console.log(
                `${i}/${ITERATIONS}: Finished ${key} - ${rubricType} - ${totalScore}`,
              );
            } catch (error) {
              console.error(error);
            }
          })(),
        );
      }
    }
  }
  // }

  await Promise.allSettled(promises);

  console.log("Finished eval");
}

async function mainReport() {
  const resultsPath = getPath("results.csv");
  if (!existsSync(resultsPath)) {
    writeFileSync(resultsPath, "type,name,rubric,score\n", "utf-8");
  }

  const promises: Promise<void>[] = [];

  const rubricType: keyof typeof rubrics.code = "simple";
  const rubric = rubrics.report[rubricType];
  // for (const [rubricType, rubric] of Object.entries(rubrics.code)) {
  for (let i = 0; i < ITERATIONS; i++) {
    promises.push(
      (async () => {
        try {
          const { object } = await gradeReport(rubric);

          const totalScore = Math.round(
            object.results.reduce((acc, criterion) => {
              const weight = rubric.criteria.find((c) => c.name === criterion.criterion);
              if (weight === undefined) {
                console.error(`${i}/${ITERATIONS}: Error ${rubricType}:`, object);

                throw new Error(
                  `Criterion ${criterion.criterion} not found in rubric ${rubricType}`,
                );
              }

              return acc + criterion.score;
            }, 0),
          );

          addRow(resultsPath, ["report", "", rubricType, totalScore.toString()]);
          console.log(`${i}/${ITERATIONS}: Finished ${rubricType} - ${totalScore}`);
        } catch (error) {
          console.error(error);
        }
      })(),
    );
  }
  // }

  await Promise.allSettled(promises);

  console.log("Finished eval");
}

main().catch((error) => {
  console.error("Error during evaluation:", error);
  process.exit(1);
});
