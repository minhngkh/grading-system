import type { CriterionData } from "@grading-system/plugin-shared/plugin/data";
import type { TestRunnerConfig } from "./config";
import type { CallbackStep, CallData } from "./core";
import { cache, CacheError } from "@grading-system/plugin-shared/lib/cache";
import logger from "@grading-system/utils/logger";
import { errAsync, fromPromise, okAsync } from "neverthrow";
import { CALLBACK_STEP } from "./core";

type Data = {
  config: CallData["config"];
  criterionData: CallData["criterionData"];
  state: CallbackStep;
  processed: number;
  total: number;
};

type RawData = Omit<Data, "config" | "criterionData"> & {
  config: string;
  criterionData: string;
};

const PREFIX = "test-runner";

export class TestRunnerMemory {
  static setUploadState(id: string, data: Omit<Data, "state" | "processed" | "total">) {
    const key = `${PREFIX}:${id}`;

    return fromPromise(
      cache.hset(key, {
        config: JSON.stringify(data.config),
        criterionData: JSON.stringify(data.criterionData),
        state: CALLBACK_STEP.UPLOAD,
        processed: 0,
        total: data.config.testCases.length,
      } satisfies RawData),
      (error) =>
        new CacheError({
          message: `Failed to set upload state for ${id}`,
          cause: error,
        }),
    );
  }

  private static CALL_FIELDS = [
    "config",
    "criterionData",
  ] as const satisfies (keyof Data)[];
  static getCallData(id: string) {
    const key = `${PREFIX}:${id}`;

    return fromPromise(
      cache.hmget(key, ...this.CALL_FIELDS),
      (error) =>
        new CacheError({
          message: `Failed to get data for ${id}`,
          cause: error,
        }),
    ).andThen((value) => {
      logger.info("Call data from mem:", value[0]);

      if (value.includes(null)) {
        return errAsync(
          new CacheError({
            message: `Missing data from memory for ${id}`,
          }),
        );
      }

      // Unsafe parse
      return okAsync({
        config: JSON.parse(value[0]!),
        criterionData: JSON.parse(value[1]!),
      } as Pick<Data, (typeof this.CALL_FIELDS)[number]>);
    });
  }

  private static STATE_FIELDS = [
    "state",
    "processed",
    "total",
  ] as const satisfies (keyof Data)[];
  static getState(id: string) {
    const key = `${PREFIX}:${id}`;

    return fromPromise(
      cache.hmget(key, ...this.STATE_FIELDS),
      (error) =>
        new CacheError({
          message: `Failed to get data for ${id}`,
          cause: error,
        }),
    ).andThen((value) => {
      if (value.includes(null)) {
        return errAsync(
          new CacheError({
            message: `Missing data from memory for ${id}`,
          }),
        );
      }

      // Unsafe parse
      return okAsync({
        state: JSON.parse(value[0]!),
        processed: JSON.parse(value[1]!),
        total: JSON.parse(value[2]!),
      } as Pick<Data, (typeof this.STATE_FIELDS)[number]>);
    });
  }
}
