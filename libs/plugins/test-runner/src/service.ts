import type { PluginOperations } from "@grading-system/plugin-shared/plugin/info";
import type { Context } from "moleculer";
import type { GoJudge } from "./go-judge-api";
import {
  criterionGradingFailedEvent,
  criterionGradingSuccessEvent,
} from "@grading-system/plugin-shared/events/index";
import { getTransporter } from "@grading-system/plugin-shared/lib/transporter";
import { createSubmissionSchemaWithConfig } from "@grading-system/plugin-shared/plugin/data";
import { defineTypedService2 } from "@grading-system/typed-moleculer/service";
import logger from "@grading-system/utils/logger";
import { ZodParams } from "moleculer-zod-validator";
import { testRunnerConfigSchema } from "./config";
import {
  compareOutput,
  gradeSubmission,
  initializeSubmission,
  runSubmission,
} from "./core";
import { TestRunnerMemory } from "./memory";

type CallbackData = {
  query: { id: string; name: string };
  body: GoJudge.RunResult;
};

const submissionSchema = createSubmissionSchemaWithConfig(testRunnerConfigSchema);

export const gradeSubmissionActionParams = new ZodParams(submissionSchema.shape);

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
        );

        await Promise.all(promises);
      },
    },

    initializeSubmission: {
      async handler(ctx: Context<CallbackData>) {
        const { query, body } = ctx.params;

        // logger.debug(`Initializing submission for ${query.id}`, info);

        const data = await TestRunnerMemory.getCallData(query.id);

        const transporter = await getTransporter();

        if (data.isErr()) {
          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: query.id,
            criterionName: query.name,
            error: data.error.message,
          });

          return;
        }

        const result = await initializeSubmission({
          attemptId: query.id,
          config: data.value.config,
          criterionData: data.value.criterionData,
        });

        if (result.isErr()) {
          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: query.id,
            criterionName: query.name,
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

        const transporter = await getTransporter();

        const initResult = body[0];
        if (initResult.exitStatus !== 0) {
          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: query.id,
            criterionName: query.name,
            error: `Build failed:\n ${initResult.files?.stderr}`,
          });

          return;
        }

        const data = await TestRunnerMemory.getCallData(query.id);

        if (data.isErr()) {
          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: query.id,
            criterionName: query.name,
            error: data.error.message,
          });

          return;
        }

        const result = await runSubmission({
          attemptId: query.id,
          config: data.value.config,
          criterionData: data.value.criterionData,
        });

        if (result.isErr()) {
          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: query.id,
            criterionName: query.name,
            error: result.error.message,
          });
        }
      },
    },

    aggregateResults: {
      async handler(ctx: Context<CallbackData>) {
        const { query, body } = ctx.params;

        // const info = await cache
        //   .multi()
        //   .hincrby(`test-runner:${params.query.id}`, "processed", -1)
        //   .rpush(`test-runner:${params.query.id}:results`, params.body)
        //   .hset(`test-runner:${params.query.id}`, { state: CALLBACK_STEP.RUN })
        //   .hgetall<CallData>(`test-runner:${params.query.id}`)
        //   .exec();

        const transporter = await getTransporter();

        const data = await TestRunnerMemory.getCallData(query.id);

        if (data.isErr()) {
          transporter.emit(criterionGradingFailedEvent, {
            assessmentId: query.id,
            criterionName: query.name,
            error: data.error.message,
          });

          return;
        }

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
            error: result.files!.stderr,
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
            rawScore: Math.round((count / feedback.length) * 100),
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
