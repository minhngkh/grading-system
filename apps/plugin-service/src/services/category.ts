import type { PluginCategory } from "@/db/models";
import { PluginCategoryModel } from "@/db/models";

export async function createCategory(data: { name: string; description?: string }) {
  return PluginCategoryModel.create({
    name: data.name,
    description: data.description,
  });
}

export async function getAllCategories() {
  return PluginCategoryModel.find().lean().exec();
}

export async function getCategoryById(id: string) {
  return PluginCategoryModel.findById(id).lean().exec();
}

export async function updateCategory(id: string, data: PluginCategory) {
  return PluginCategoryModel.findByIdAndUpdate(id, data, { new: true }).lean().exec();
}

export async function deleteCategory(id: string) {
  return PluginCategoryModel.findByIdAndDelete(id).lean().exec();
}
