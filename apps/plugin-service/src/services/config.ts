import logger from "@grading-system/utils/logger";
import { z } from "zod";
import { PluginConfigModel } from "@/db/models";
import { testRunnerConfigSchema } from "@/plugins/test-runner/config";

export const pluginConfigSchema = z.discriminatedUnion("type", [testRunnerConfigSchema]);

// TODO: it currently doesn't failed
export async function createConfig(config: z.infer<typeof pluginConfigSchema>) {
  logger.debug("Creating plugin config", { config });
  return (await PluginConfigModel.create({ config })).toObject();
}

export async function updateConfig(
  id: string,
  config: z.infer<typeof pluginConfigSchema>,
) {
  return await PluginConfigModel.findByIdAndUpdate(id, { config }, { new: true })
    .lean()
    .exec();
}

export async function getConfig(id: string) {
  return await PluginConfigModel.findById(id).lean().exec();
}
