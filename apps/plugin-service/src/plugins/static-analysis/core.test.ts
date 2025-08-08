import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StaticAnalysisConfig } from "./config";

// Mock the database models before importing core
vi.mock("@/db/models", () => ({
  PluginCategoryModel: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
  },
  PluginModel: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
  },
  PluginConfigModel: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
  },
}));

// Mock the blob storage module before importing core
vi.mock("@/lib/blob-storage", () => ({
  downloadBlobBatch: vi.fn(),
  submissionStore: {
    downloadBlobToPath: vi.fn(),
    listBlobs: vi.fn(),
  },
  rubricContextStore: {
    downloadBlobToPath: vi.fn(),
    listBlobs: vi.fn(),
  },
}));

// eslint-disable-next-line import/first
import { gradeCriterion } from "./core";

describe("running static analysis", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("test", async () => {
    const config: StaticAnalysisConfig = {
      type: "static-analysis",
      version: 1,
      crossFileAnalysis: false,
      preset: { type: "auto" },
      additionalRulesets: [],
      deductionMap: { critical: 10, error: 5, warning: 2, info: 1 },
    };

    const data = {
      attemptId: "attempt1",
      criterionData: {} as any,
      fileList: ["c_test.c", "python_test.py"],
      directory: path.join(process.cwd(), "src/plugins/static-analysis/code_test"),
      // directory: "code_test", // Uncomment if you want
      config,
    };

    const result = await gradeCriterion(data);


    // TODO: hmm
    // expect(result.isOk()).toBe(true);
    console.log(result.isOk() ? result.value: result.error);
  });
});
