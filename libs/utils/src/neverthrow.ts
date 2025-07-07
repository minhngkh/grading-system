import type { Result, ResultAsync } from "neverthrow";

/**
 * Won't throw any errors
 */
export type PlainResult<T, E> =
  | {
      success: true;
      value: T;
    }
  | {
      success: false;
      error: E;
    };

/**
 * Won't throw any errors
 */
export type PlainResultAsync<T, E> = Promise<PlainResult<T, E>>;

export function toPlainObject<T, E>(result: Result<T, E>): PlainResult<T, E>;
export function toPlainObject<T, E>(result: ResultAsync<T, E>): PlainResultAsync<T, E>;
export function toPlainObject<T, E>(result: Result<T, E> | ResultAsync<T, E>) {
  return result.match(
    (value) => ({ success: true, value }),
    (error) => ({ success: false, error }),
  );
}
