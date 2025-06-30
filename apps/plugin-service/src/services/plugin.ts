import type { Plugin } from "@/db/models";
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

/**
 * Get all plugins with optional population of category
 */
export async function getAllPlugins() {
  const query = PluginModel.find();

  // if (populateCategory) {
  //   query.populate<{ categories: PluginCategory }>("categories", "-_id alias");
  // }

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
 * Get plugin by ID
 */
export async function getPluginById(id: string): Promise<Plugin | null> {
  const query = PluginModel.findById(id);

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
