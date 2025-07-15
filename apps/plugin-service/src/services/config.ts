import type { z, ZodSchema } from "zod";
import type { pluginConfigSchema } from "@/plugins/info";
import { CustomError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { zodParse } from "@grading-system/utils/zod";
import { errAsync, fromPromise, okAsync, safeTry } from "neverthrow";
import { PluginConfigModel } from "@/db/models";

// TODO: it currently doesn't failed
export async function createConfig(
  config: z.infer<typeof pluginConfigSchema>,
  pluginId: string,
) {
  logger.debug("Creating plugin config", { config });
  return (await PluginConfigModel.create({ config, plugin: pluginId })).toObject();
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

export async function getConfigOfPlugin(configId: string, pluginId: string) {
  return await PluginConfigModel.findOne({ _id: configId, plugin: pluginId })
    .lean()
    .exec();
}

class GetConfigError extends CustomError.withTag("GetConfigError")<void> {}
class ConfigNotFoundError extends CustomError.withTag("ConfigNotFoundError")<{
  id: string;
}> {}
class ConfigMalformedError extends CustomError.withTag("ConfigMalformedError")<{
  id: string;
}> {}

export function getTypedConfig<T extends ZodSchema>(id: string, schema: T) {
  return safeTry(async function* () {
    const rawConfig = yield* fromPromise(
      getConfig(id),
      (error) => new GetConfigError({ cause: error }),
    );

    if (rawConfig === null) {
      return errAsync(new ConfigNotFoundError({ data: { id } }));
    }

    if (rawConfig.config === undefined) {
      return errAsync(new ConfigMalformedError({ data: { id } }));
    }

    const config: z.infer<T> = yield* zodParse(rawConfig.config, schema).orTee((error) =>
      logger.info("Plugin config parsing error", error),
    );

    return okAsync(config);
  });
}
