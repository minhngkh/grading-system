import type { Types } from "mongoose";
import type { Plugin, PluginCategory } from "@/db/models";
import { PluginCategoryModel, PluginModel } from "@/db/models";

export interface CreatePluginData {
  alias: string;
  name: string;
  description?: string;
  categoryId?: string;
  enabled?: boolean;
}

export interface UpdatePluginData {
  name?: string;
  description?: string;
  categoryId?: string;
  enabled?: boolean;
}

// /**
//  * Check if current plugins differ from defaults and need updates
//  */
// export async function checkPluginSync(): Promise<{
//   needsSync: boolean;
//   missingPlugins: string[];
//   extraPlugins: string[];
// }> {
//   try {
//     const existingPlugins = await PluginModel.find({}).lean().exec();
//     const existingAliases = new Set(existingPlugins.map(p => p.alias));
//     const defaultAliases = new Set(DEFAULT_PLUGINS.map(p => p.alias));

//     const missingPlugins = DEFAULT_PLUGINS
//       .filter(p => !existingAliases.has(p.alias))
//       .map(p => p.alias);

//     const extraPlugins = existingPlugins
//       .filter(p => !defaultAliases.has(p.alias))
//       .map(p => p.alias);

//     const needsSync = missingPlugins.length > 0;

//     return {
//       needsSync,
//       missingPlugins,
//       extraPlugins,
//     };
//   } catch (error) {
//     logger.error("Failed to check plugin sync:", error);
//     throw error;
//   }
// }

/**
 * Create a new plugin
 */
export async function createPlugin(data: CreatePluginData): Promise<Plugin> {
  // Check if plugin with alias already exists
  const existingPlugin = await PluginModel.findOne({ alias: data.alias });
  if (existingPlugin) {
    throw new Error(`Plugin with alias '${data.alias}' already exists`);
  }

  // Validate category if provided
  let categoryId: Types.ObjectId | undefined;
  if (data.categoryId) {
    const category = await PluginCategoryModel.findById(data.categoryId);
    if (!category) {
      throw new Error(`Category with id '${data.categoryId}' not found`);
    }
    categoryId = category._id;
  }

  return PluginModel.create({
    alias: data.alias,
    name: data.name,
    description: data.description,
    category: categoryId,
    enabled: data.enabled ?? true,
  });
}

/**
 * Get all plugins with optional population of category
 */
export async function getAllPlugins(populateCategory = true) {
  const query = PluginModel.find();

  if (populateCategory) {
    query.populate<{ categories: PluginCategory }>("categories", "-_id alias");
  }

  return query.lean().exec();
}

/**
 * Get plugins by category
 */
export async function getPluginsByCategory(categoryId?: string): Promise<Plugin[]> {
  const filter = categoryId ? { category: categoryId } : { category: { $exists: false } }; // Get uncategorized plugins

  return PluginModel.find(filter).populate("category").lean().exec();
}

/**
 * Get plugin by alias
 */
export async function getPluginByAlias(
  alias: string,
  populateCategory = true,
): Promise<Plugin | null> {
  const query = PluginModel.findOne({ alias });

  if (populateCategory) {
    query.populate("categories", "-_id alias");
  }

  return query.lean().exec();
}

/**
 * Get plugin by ID
 */
export async function getPluginById(
  id: string,
  populateCategory = true,
): Promise<Plugin | null> {
  const query = PluginModel.findById(id);

  if (populateCategory) {
    query.populate("category");
  }

  return query.lean().exec();
}

/**
 * Update plugin
 */
export async function updatePlugin(
  id: string,
  data: UpdatePluginData,
): Promise<Plugin | null> {
  // Validate category if provided
  if (data.categoryId) {
    const category = await PluginCategoryModel.findById(data.categoryId);
    if (!category) {
      throw new Error(`Category with id '${data.categoryId}' not found`);
    }
  }

  const updateData: any = { ...data };
  if (data.categoryId) {
    updateData.category = data.categoryId;
    delete updateData.categoryId;
  }

  return PluginModel.findByIdAndUpdate(id, updateData, { new: true })
    .populate("category")
    .lean()
    .exec();
}

/**
 * Enable/disable plugin
 */
export async function togglePlugin(id: string, enabled: boolean): Promise<Plugin | null> {
  return PluginModel.findByIdAndUpdate(id, { enabled }, { new: true })
    .populate("category")
    .lean()
    .exec();
}

/**
 * Delete plugin
 */
export async function deletePlugin(id: string): Promise<Plugin | null> {
  return PluginModel.findByIdAndDelete(id).populate("category").lean().exec();
}

// /**
//  * Get plugins grouped by category
//  */
// export async function getPluginsGroupedByCategory(): Promise<{
//   [categoryName: string]: Plugin[];
//   uncategorized: Plugin[];
// }> {
//   const plugins = await getAllPlugins(true);

//   const grouped: { [categoryName: string]: Plugin[] } = {
//     uncategorized: [],
//   };

//   for (const plugin of plugins) {
//     if (plugin.category && typeof plugin.category === 'object' && 'name' in plugin.category) {
//       const categoryName = plugin.category.name;
//       if (!grouped[categoryName]) {
//         grouped[categoryName] = [];
//       }
//       grouped[categoryName].push(plugin);
//     } else {
//       grouped.uncategorized.push(plugin);
//     }
//   }

//   return grouped;
// }

/**
 * Search plugins by name, alias, or description
 */
export async function searchPlugins(
  query: string,
  enabledOnly = false,
): Promise<Plugin[]> {
  const searchRegex = new RegExp(query, "i");

  const filter: any = {
    $or: [{ name: searchRegex }, { alias: searchRegex }, { description: searchRegex }],
  };

  if (enabledOnly) {
    filter.enabled = true;
  }

  return PluginModel.find(filter).populate("category").lean().exec();
}
