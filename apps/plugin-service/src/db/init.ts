import type { Plugin, PluginCategory } from "./models";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { PluginCategoryModel, PluginModel } from "./models";

const CATEGORIES = [
  {
    _id: "general",
    name: "General",
    description: "General purpose plugins",
  },
  {
    _id: "ai",
    name: "AI",
    description: "Plugins utilizing AI models",
  },
  {
    _id: "code",
    name: "Code",
    description: "Code replated plugins",
  },
] as const satisfies PluginCategory[];

const PLUGINS = [
  {
    _id: "ai",
    name: "AI grader",
    description: "Grade rubric using AI language models",
    categories: ["ai", "general"],
    enabled: true,
  },
  {
    _id: "test-runner",
    name: "Test Runner",
    description: "Run tests on submissions",
    categories: ["code"],
    enabled: false,
  },
  {
    _id: "test",
    name: "Test Plugin",
    description: "A test plugin for demonstration purposes",
    categories: [],
    enabled: false,
  },
  // ] satisfies (Omit<Plugin, "categories"> & {
  //   categoryAliases: (typeof CATEGORIES)[number]["alias"][];
  // })[];
] satisfies Plugin[];

export async function syncDB() {
  try {
    const existingCategories = await PluginCategoryModel.find({
      _id: { $in: CATEGORIES.map((cat) => cat._id) },
    })
      .lean()
      .exec();

    logger.debug("Existing categories:", existingCategories);

    const missingCategories = CATEGORIES.filter((cat) =>
      existingCategories.every((existing) => existing._id !== cat._id),
    );

    await Promise.all(
      missingCategories.map(async (cat) => {
        await PluginCategoryModel.create({
          _id: cat._id,
          name: cat.name,
          description: cat.description,
        });
      }),
    );

    await PluginModel.insertMany(PLUGINS, { ordered: false }).catch((err) => {
      if (!(err instanceof Error && err.name === "MongoBulkWriteError")) {
        throw err;
      }
    });

    logger.info("DB Sync completed: Categories and plugins initialized");
  } catch (error) {
    throw wrapError(asError(error), "Failed to sync DB");
  }
}
