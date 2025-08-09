import type { PluginOperations } from "@grading-system/plugin-shared/plugin/info";
import type { Context } from "moleculer";
import type { CachedData, CallData } from "@/plugins/test-runner/core";
import type { GoJudge } from "@/plugins/test-runner/go-judge-api";
import { actionCaller } from "@grading-system/typed-moleculer/action";
import { defineTypedService2 } from "@grading-system/typed-moleculer/service";
import logger from "@grading-system/utils/logger";
import { expect } from "vitest";
import { cache } from "@/lib/cache";
import { getTransporter } from "@/lib/transporter";
import {
  criterionGradingFailedEvent,
  criterionGradingSuccessEvent,
} from "@/messaging/events";
import { gradeSubmissionActionParams } from "@/plugins/data";
import {
  CALLBACK_STEP,
  compareOutput,
  getCachedData,
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

        const promises = result.value.map(
          (value) =>
            value.orTee((error) => {
              logger.info(
                `internal: Grading failed for ${error.data.criterionName}`,
                error,
              );

              transporter.emit(criterionGradingFailedEvent, {
                assessmentId: params.assessmentId,
                criterionName: error.data.criterionName,
                error: error.message,
              });
            }),
          // .andTee(() => {
          //   transporter.emit(criterionGradingFailedEvent, {
          //     assessmentId: params.assessmentId,
          //     criterionName: params.criterionDataList[0].criterionName,
          //     error: "waiting implementation",
          //   });
          // }),
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

        const transporter = await getTransporter();

        const initResult = body[0];
        if (initResult.exitStatus !== 0) {
          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: data.attemptId,
            criterionName: data.criterionData.criterionName,
            error: `Build failed:\n ${initResult.files?.stderr}`,
          });
          
          return;
        }

        const result = await runSubmission(data);

        if (result.isErr()) {
          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: data.attemptId,
            criterionName: data.criterionData.criterionName,
            error: result.error.message,
          });
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
        const { query, body } = ctx.params;

        // const info = await cache
        //   .multi()
        //   .hincrby(`test-runner:${params.query.id}`, "processed", -1)
        //   .rpush(`test-runner:${params.query.id}:results`, params.body)
        //   .hset(`test-runner:${params.query.id}`, { state: CALLBACK_STEP.RUN })
        //   .hgetall<CallData>(`test-runner:${params.query.id}`)
        //   .exec();

        const data = await getCachedData(query.id);

        if (data.isErr()) {
          throw new Error(`No submission found for id: ${query.id}`);
        }

        const transporter = await getTransporter();

        const feedback = [];

        let count = 0;

        for (const [idx, result] of body.entries()) {
          const actualOutput = result.files!.stdout!;
          const expectedOutput = data.value.config.testCases[idx].expectedOutput;

          const comparisonResult = compareOutput(
            actualOutput,
            expectedOutput,
            data.value.config.outputComparison,
          );

          if (comparisonResult) {
            count++;
          }

          feedback.push({
            testCase: idx + 1,
            passed: comparisonResult,
            input: data.value.config.testCases[idx].input,
            output: actualOutput,
            expectedOutput,
          });
        }

        feedback.sort((a, b) =>
          a.passed === b.passed ? 0
          : a.passed ? -1
          : 1,
        );

        transporter.emit(criterionGradingSuccessEvent, {
          assessmentId: query.id,
          criterionName: data.value.criterionData.criterionName,
          metadata: {
            // Dirty hack for ui
            plugin: "test-runner",
            feedback,
          },
          scoreBreakdown: {
            tag: "",
            rawScore: count / feedback.length,
            feedbackItems: [],
          },
        });
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
