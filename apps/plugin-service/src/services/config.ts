import type { z, ZodSchema } from "zod";
import type { pluginConfigSchema} from "@/plugins/info";
import { CustomError, DefaultError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { zodParse } from "@grading-system/utils/zod";
import { errAsync, fromPromise, okAsync, safeTry } from "neverthrow";
import { PluginConfigModel } from "@/db/models";
import { plugins } from "@/plugins/info";

// TODO: it currently doesn't failed
export async function createConfig(
  config: z.infer<typeof pluginConfigSchema>,
  pluginId: string,
) {
  logger.debug("Creating plugin config", { config });

  // if (pluginId === plugins.ai.id) {
  //   return {
  //     _id: `embed:${JSON.stringify(config)}`,
  //     plugin: plugins.ai.id,
  //     config,
  //   };
  // }

  return (await PluginConfigModel.create({ config, plugin: pluginId })).toObject();
}

export async function updateConfig(
  id: string,
  config: z.infer<typeof pluginConfigSchema>,
) {
  // if (id === plugins.ai.id) {
  //   return {
  //     _id: `embed:${JSON.stringify(config)}`,
  //     plugin: plugins.ai.id,
  //     config,
  //   };
  // }

  return await PluginConfigModel.findByIdAndUpdate(id, { config }, { new: true })
    .lean()
    .exec();
}

export async function getConfig(id: string) {
  // if (id === plugins.ai.id) {
  //   const raw = JSON.parse(id.replace("embed:", ""));
  //   const parsed = zodParse(raw, pluginConfigSchema);

  //   if (parsed.isErr()) {
  //     throw new DefaultError({
  //       message: "Failed to parse embedded AI config",
  //       cause: parsed.error,
  //     });
  //   }

  //   return {
  //     _id: id,
  //     plugin: plugins.ai.id,
  //     config: parsed.value,
  //   };
  // }

  return await PluginConfigModel.findById(id).lean().exec();
}

export async function getConfigs(ids: string[]) {
  // const configs = [];
  // const filteredIds = [];
  // for (const id of ids) {
  //   if (id.startsWith("embed:")) {
  //     const raw = JSON.parse(id.replace("embed:", ""));
  //     const parsed = zodParse(raw, pluginConfigSchema);

  //     if (parsed.isErr()) {
  //       throw new DefaultError({
  //         message: "Failed to parse embedded AI config",
  //         cause: parsed.error,
  //       });
  //     }

  //     configs.push({
  //       _id: id,
  //       plugin: plugins.ai.id,
  //       config: parsed.value,
  //     });
  //   } else {
  //     filteredIds.push(id);
  //   }
  // }

  const normalConfigs = await PluginConfigModel.find({ _id: { $in: ids } })
    .lean()
    .exec();

  return normalConfigs;

  // return [...configs, ...normalConfigs];
}

export async function getConfigOfPlugin(configId: string, pluginId: string) {
  // if (pluginId === plugins.ai.id) {
  //   if (configId.startsWith("embed:")) {
  //     const raw = JSON.parse(configId.replace("embed:", ""));
  //     const parsed = zodParse(raw, pluginConfigSchema);

  //     if (parsed.isErr()) {
  //       throw new DefaultError({
  //         message: "Failed to parse embedded AI config",
  //         cause: parsed.error,
  //       });
  //     }

  //     return {
  //       _id: configId,
  //       plugin: plugins.ai.id,
  //       config: parsed.value,
  //     };
  //   } else {
  //     throw new ConfigNotFoundError({
  //       message: "Embedded AI config not found",
  //       data: { id: configId },
  //     });
  //   }
  // }

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
      (error) =>
        new GetConfigError({
          message: `Failed to get plugin config`,
          cause: error,
        }),
    );

    if (rawConfig === null) {
      return errAsync(
        new ConfigNotFoundError({
          message: `Plugin config not found`,
          data: { id },
        }),
      );
    }

    if (rawConfig.config === undefined) {
      return errAsync(
        new ConfigMalformedError({
          message: `Plugin config is malformed`,
          data: { id },
        }),
      );
    }

    const config: z.infer<T> = yield* zodParse(rawConfig.config, schema).orTee((error) =>
      logger.info("Plugin config parsing error", error),
    );

    return okAsync(config);
  });
}
