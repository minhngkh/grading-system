import type { Entries, ExtendEntries } from "@grading-system/utils/typescript";
import type { ServiceBroker } from "moleculer";
import { actionCaller } from "@grading-system/typed-moleculer/action";
import { asError } from "@grading-system/utils/error";
import { fromPromise, fromSafePromise, okAsync, safeTry } from "neverthrow";
import { getTransporter } from "@/lib/transporter";
import { criterionGradingFailedEvent, submissionStartedEvent } from "@/messaging/events";
import { plugins } from "@/plugins/info";

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

      for (const criterion of data.criteria) {
        // switch (criterion.plugin) {
        //   case plugins.ai.id:
        //     tasks.ai.criteria.push(criterion);
        //     break;
        //   case plugins.testRunner.id:
        //     tasks.testRunner.criteria.push(criterion);
        //     break;
        //   default:
        //     transporter.emit(criterionGradingFailedEvent, {
        //       assessmentId: data.assessmentId,
        //       criterionName: criterion.criterionName,
        //       error: `Unsupported plugin: ${criterion.plugin}`,
        //     });
        //   // tasks.ai.criteria.push(criterion);
        // }
        if (criterion.plugin in tasks) {
          tasks[criterion.plugin as keyof typeof tasks].criteria.push(criterion);
        } else {
          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: data.assessmentId,
            criterionName: criterion.criterionName,
            error: `Unsupported plugin: ${criterion.plugin}`,
          });
        }
      }

      const promises = [];

      for (const [_, task] of Object.entries(tasks)) {
        if (task.criteria.length === 0) {
          continue;
        }

        promises.push(
          fromPromise(
            actionCaller<(typeof task)["~type"]>()(broker, task.operations.grade.action, {
              assessmentId: data.assessmentId,
              criterionDataList: task.criteria,
              attachments: data.attachments,
              metadata: data.metadata,
            }).then(() => undefined),
            (error) => {
              // Emit failure events for each criterion in the task if there is error
              // calling the grading action
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
