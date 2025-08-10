import type { ExtendEntries } from "@grading-system/utils/typescript";
import type { ServiceBroker } from "moleculer";
import { getTransporter } from "@grading-system/plugin-shared/lib/transporter";
import { actionCaller } from "@grading-system/typed-moleculer/action";
import { asError, wrapError } from "@grading-system/utils/error";
import logger from "@grading-system/utils/logger";
import { fromPromise, fromSafePromise, okAsync, safeTry } from "neverthrow";
import { criterionGradingFailedEvent, submissionStartedEvent } from "@/messaging/events";
import { plugins, pluginsMap } from "@/plugins/info";
import { getConfigs } from "@/services/config";

export async function initMessaging(broker: ServiceBroker) {
  // All of the function above can throw and make the system exit as it should
  const transporter = await getTransporter();

  transporter.consume(submissionStartedEvent, (data) =>
    safeTry(async function* () {
      // const tasks = {
      //   ai: {
      //     "~type": undefined as unknown as AIService,
      //     actionName: "v1.ai.gradeSubmission" as ServiceActionPath<AIService>,
      //     criteria: [] as typeof data.criteria,
      //   },
      //   testRunner: {
      //     "~type": undefined as unknown as AIService,
      //     actionName: "v1.ai.gradeSubmission" as ServiceActionPath<AIService>,
      //     criteria: [] as typeof data.criteria,
      //   },
      // };

      // function addFieldsToPlugins<T extends Record<any, any>>(pluginsObj: T) {
      //   const result = {} as {
      //     [K in keyof T]: T[K] & { criteria: typeof data.criteria };
      //   };

      //   for (const key in pluginsObj) {
      //     result[key] = {
      //       ...pluginsObj[key],
      //       criteria: [],
      //     };
      //   }
      //   return result;
      // }

      const tasks = Object.entries(plugins).reduce(
        (acc, [key, value]) => {
          // @ts-expect-error key is a valid key of plugins
          acc[key] = { ...value, criteria: [] };
          return acc;
        },
        {} as ExtendEntries<typeof plugins, { criteria: typeof data.criteria }>,
      );

      const configIds = [];

      for (const criterion of data.criteria) {
        if (pluginsMap.has(criterion.plugin)) {
          tasks[pluginsMap.get(criterion.plugin)!].criteria.push(criterion);

          if (criterion.configuration) {
            configIds.push(criterion.configuration);
          }
        } else {
          logger.debug(`Unsupported plugin: ${criterion.plugin}, fallback to 'ai'`);
          tasks.ai.criteria.push(criterion);

          if (criterion.configuration) {
            configIds.push(criterion.configuration);
          }

          // transporter.emit(criterionGradingFailedEvent, {
          //   assessmentId: data.assessmentId,
          //   criterionName: criterion.criterionName,
          //   error: `Unsupported plugin: ${criterion.plugin}`,
          // });
        }
      }

      const configs = yield* fromPromise(getConfigs(configIds), (error) =>
        wrapError(error, "Failed to get plugin configs"),
      );

      const promises = [];

      for (const [_, task] of Object.entries(tasks)) {
        if (task.criteria.length === 0) {
          continue;
        }

        const criteria = [];
        for (const criterion of task.criteria) {
          if (criterion.configuration) {
            const config = configs.find(
              (c) => c._id.toString() === criterion.configuration,
            );
            if (config) {
              criterion.configuration = config.config;
            } else {
              logger.error(
                `Configuration not found for criterion ${criterion.criterionName}`,
              );
            }
          }

          criteria.push(criterion);
        }

        // actionCaller<StaticAnalysisService>()(broker, "v1.static-analysis.gradeSubmission", {
        //   criterionDataList
        // });

        promises.push(
          fromPromise(
            actionCaller<(typeof task)["~type"]>()(broker, task.operations.grade.action, {
              assessmentId: data.assessmentId,
              criterionDataList: criteria,
              attachments: data.attachments,
              metadata: data.metadata,
            }).then(() => undefined),
            (error) => {
              logger.error("Unable to communicate with plugin", error);

              for (const criterion of task.criteria) {
                transporter.emit(criterionGradingFailedEvent, {
                  assessmentId: data.assessmentId,
                  criterionName: criterion.criterionName,
                  error: asError(error).message,
                });
              }
            },
          ),
        );
      }

      yield* fromSafePromise(Promise.all(promises));
      return okAsync();
    }),
  );
}
