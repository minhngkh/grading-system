import type { Context } from "moleculer";
import type { PluginOperations } from "@/plugins/info";
import type { CachedData, CallData } from "@/plugins/test-runner/core";
import type { GoJudge } from "@/plugins/test-runner/go-judge-api";
import { actionCaller } from "@grading-system/typed-moleculer/action";
import { defineTypedService2 } from "@grading-system/typed-moleculer/service";
import logger from "@grading-system/utils/logger";
import { cache } from "@/lib/cache";
import { getTransporter } from "@/lib/transporter";
import {
  criterionGradingFailedEvent,
  criterionGradingSuccessEvent,
} from "@/messaging/events";
import { gradeSubmissionActionParams } from "@/plugins/data";
import {
  CALLBACK_STEP,
  gradeSubmission,
  initializeSubmission,
  runSubmission,
} from "@/plugins/test-runner/core";

type CallbackData = {
  query: { id: string };
  body: GoJudge.RunResult;
};

export const testRunnerService = defineTypedService2({
  name: "test-runner",
  version: 1,
  actions: {
    gradeSubmission: {
      params: gradeSubmissionActionParams.schema,
      async handler(ctx: Context<typeof gradeSubmissionActionParams.context>) {
        const params = ctx.params;

        const result = await gradeSubmission({
          attemptId: params.assessmentId,
          criterionDataList: params.criterionDataList,
          attachments: params.attachments,
          metadata: params.metadata,
        });

        if (result.isErr()) {
          throw new Error(result.error.message);
        }

        const transporter = await getTransporter();

        const promises = result.value.map((value) =>
          value
            .orTee((error) => {
              logger.info(
                `internal: Grading failed for ${error.data.criterionName}`,
                error,
              );

              transporter.emit(criterionGradingFailedEvent, {
                assessmentId: params.assessmentId,
                criterionName: error.data.criterionName,
                error: error.message,
              });
            })
            .andTee(() => {
              transporter.emit(criterionGradingFailedEvent, {
                assessmentId: params.assessmentId,
                criterionName: params.criterionDataList[0].criterionName,
                error: "waiting implementation",
              });
            }),
        );

        await Promise.all(promises);
      },
    },

    initializeSubmission: {
      async handler(ctx: Context<CallbackData>) {
        const { query, body } = ctx.params;

        const info = await cache.hmget<Pick<CachedData, "config" | "criterionData">>(
          `test-runner:${query.id}`,
          "config",
          "criterionData",
        );

        logger.debug(`Initializing submission for ${query.id}`, info);

        if (info === null) {
          throw new Error(`No submission found for id: ${query.id}`);
        }

        const data: CallData = {
          attemptId: query.id,
          config: info.config,
          criterionData: info.criterionData,
        };

        const result = await initializeSubmission(data);

        if (result.isErr()) {
          const transporter = await getTransporter();

          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: data.attemptId,
            criterionName: data.criterionData.criterionName,
            error: result.error.message,
          });

          return;
        }

        if (!result.value.init) {
          // @ts-expect-error not typed safe...
          this.actions.runSubmission(ctx.params, { parentCtx: ctx });
        }
      },
    },

    runSubmission: {
      async handler(ctx: Context<CallbackData>) {
        const { query, body } = ctx.params;


        const info = await cache.hmget<Pick<CallData, "config" | "criterionData">>(
          `test-runner:${query.id}`,
          "config",
          "criterionData",
        );

        if (info === null) {
          throw new Error(`No submission found for id: ${query.id}`);
        }

        const data: CallData = {
          attemptId: query.id,
          config: info.config,
          criterionData: info.criterionData,
        };

        const result = await runSubmission(data);

        if (result.isErr()) {
          const value = await cache.hincrby(
            `test-runner:${data.attemptId}`,
            "processed",
            -result.error.length,
          );

          // if (value <= 0) {
          //   const results = await cache.lrange(
          //     `test-runner:${data.attemptId}:results`,
          //     0,
          //     -1,
          //   );
          //   const transporter = await getTransporter();

          //   transporter.emit(criterionGradingSuccessEvent, {
          //     assessmentId: data.attemptId,
          //     criterionName: data.criterionData.criterionName,
          //     metadata: {},
          //     scoreBreakdown: {
          //       tag: "",
          //       rawScore: ,
          //       maxScore: data.criterionData.maxScore,

          //     },
          //   });
          // }
        }
      },
    },

    aggregateResults: {
      async handler(
        ctx: Context<{
          query: { id: string };
          body: GoJudge.RunResult;
        }>,
      ) {
        const params = ctx.params;

        const info = await cache
          .multi()
          .hincrby(`test-runner:${params.query.id}`, "processed", -1)
          .rpush(`test-runner:${params.query.id}:results`, params.body)
          .hset(`test-runner:${params.query.id}`, { state: CALLBACK_STEP.RUN })
          .hgetall<CallData>(`test-runner:${params.query.id}`)
          .exec();

        const processed = info[0];
        const actualInfo = info[3];

        if (actualInfo === null) {
          throw new Error(`No submission found for id: ${params.query.id}`);
        }

        const data: CallData = {
          attemptId: params.query.id,
          config: actualInfo.config,
          criterionData: actualInfo.criterionData,
        };

        if (info === null) {
          throw new Error(`No submission found for id: ${data.attemptId}`);
        }

        logger.debug(`Aggregating results for ${data.attemptId}`, params.body);

        // const transporter = await getTransporter();
        // transporter.emit(criterionGradingFailedEvent, {
        //   assessmentId: data.attemptId,
        //   criterionName: data.criterionData.criterionName,
        //   error: "waiting implementation",
        // });
      },
    },
  },
});

export type TestRunnerService = typeof testRunnerService;

export const testRunnerPluginOperations = {
  grade: {
    action: "v1.test-runner.gradeSubmission",
  },
} satisfies PluginOperations<TestRunnerService>;
