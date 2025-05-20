import type { Types } from "mongoose";
import type { Plugin, PluginCategory } from "./models";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { PluginCategoryModel, PluginModel } from "./models";

const CATEGORIES = [
  {
    alias: "general",
    name: "General",
    description: "General purpose plugins",
  },
  {
    alias: "ai",
    name: "AI",
    description: "Plugins utilizing AI models",
  },
  {
    alias: "code",
    name: "Code",
    description: "Code replated plugins",
  },
] as const satisfies PluginCategory[];

const PLUGINS = [
  {
    alias: "ai",
    name: "AI grader",
    description: "Grade rubric using AI language models",
    categoryAliases: ["ai", "general"],
    enabled: true,
  },
  {
    alias: "test-runner",
    name: "Test Runner",
    description: "Run tests on submissions",
    categoryAliases: ["code"],
    enabled: false,
  },
  {
    alias: "test",
    name: "Test Plugin",
    description: "A test plugin for demonstration purposes",
    categoryAliases: [],
    enabled: false,
  },
] satisfies (Omit<Plugin, "categories"> & {
  categoryAliases: (typeof CATEGORIES)[number]["alias"][];
})[];

export async function syncDB() {
  try {
    const CategoryAliasIdMap = new Map<string, Types.ObjectId>();

    const existingCategories = await PluginCategoryModel.find({
      alias: { $in: CATEGORIES.map((cat) => cat.alias) },
    })
      .lean()
      .exec();

    for (const category of existingCategories) {
      CategoryAliasIdMap.set(category.alias, category._id);
    }

    const missingCategories = CATEGORIES.filter(
      (cat) => !CategoryAliasIdMap.has(cat.alias),
    );

    Promise.all(
      missingCategories.map(async (cat) => {
        const newCategory = await PluginCategoryModel.create({
          alias: cat.alias,
          name: cat.name,
          description: cat.description,
        });

        CategoryAliasIdMap.set(cat.alias, newCategory._id);
      }),
    );

    const pluginDocuments = PLUGINS.map((plugin) => {
      const categoryIds = plugin.categoryAliases.map((alias) =>
        CategoryAliasIdMap.get(alias)!,
      );

      logger.debug(`${categoryIds}`);

      return {
        alias: plugin.alias,
        name: plugin.name,
        description: plugin.description,
        categories: categoryIds,
        enabled: plugin.enabled,
      };
    });

    await PluginModel.insertMany(pluginDocuments, { ordered: false }).catch((err) => {
      if (!(err instanceof Error && err.name === "MongoBulkWriteError")) {
        throw err;
      }
    });

    logger.info("DB Sync completed: Categories and plugins initialized");
  } catch (error) {
    throw wrapError(asError(error), "Failed to sync DB");
  }
}
