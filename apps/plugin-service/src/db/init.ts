import type { Plugin, PluginCategory } from "./models";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { CATEGORIES, plugins as pluginsInfo } from "@/plugins/info";
import { PluginCategoryModel, PluginModel } from "./models";

// const categories = [
//   {
//     _id: "general",
//     name: "General",
//     description: "General purpose plugins",
//   },
//   {
//     _id: "ai",
//     name: "AI",
//     description: "Plugins utilizing AI models",
//   },
//   {
//     _id: "code",
//     name: "Code",
//     description: "Code replated plugins",
//   },
// ] as const satisfies PluginCategory[];

const categories = CATEGORIES.map(
  (cat) =>
    ({
      _id: cat.id,
      name: cat.name,
      description: cat.description,
    }) as PluginCategory,
);

const plugins = Object.entries(pluginsInfo).map(
  ([_, plugin]) =>
    ({
      _id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      categories: plugin.categories,
      enabled: plugin.enabled,
      operations: plugin.operations,
      configSchema: plugin.configSchema,
      checkConfig: plugin.checkConfig,
    }) as Plugin,
);

export async function syncDB() {
  try {
    const existingCategories = await PluginCategoryModel.find({
      _id: { $in: categories.map((cat) => cat._id) },
    })
      .lean()
      .exec();

    logger.debug("Existing categories:", existingCategories);

    const missingCategories = categories.filter((cat) =>
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

    // await PluginModel.insertMany(plugins, { ordered: false }).catch((err) => {
    //   if (!(err instanceof Error && err.name === "MongoBulkWriteError")) {
    //     throw err;
    //   }
    // });

    // Remove all existing plugins and replace with current ones
    // await PluginModel.deleteMany({});
    // await PluginModel.insertMany(plugins, { ordered: false });

    // Get current plugin IDs from configuration
    const currentPluginIds = plugins.map((p) => p._id);

    // Remove plugins that are no longer in configuration
    await PluginModel.deleteMany({ _id: { $nin: currentPluginIds } });

    // Upsert current plugins
    const pluginOperations = plugins.map((plugin) => ({
      replaceOne: {
        filter: { _id: plugin._id },
        replacement: plugin,
        upsert: true,
      },
    }));

    await PluginModel.bulkWrite(pluginOperations, { ordered: false });

    logger.info("DB Sync completed: Categories and plugins initialized");
  } catch (error) {
    throw wrapError(asError(error), "Failed to sync DB");
  }
}
