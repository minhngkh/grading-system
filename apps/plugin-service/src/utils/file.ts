import type { Result } from "neverthrow";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { asError, wrapError } from "@grading-system/utils/error";
import { err, ResultAsync } from "neverthrow";

/**
 * Non-throwing
 * @returns
 */
export async function createTempDirectory(): Promise<Result<string, Error>> {
  const result = await ResultAsync.fromPromise(
    fs.mkdtemp(path.join(os.tmpdir(), "plugin-service-")),
    asError,
  );

  return result;
}

/**
 * Non-throwing
 * @param path
 * @returns
 */
export async function cleanTempDirectory(path: string): Promise<Result<void, Error>> {
  if (!path.includes("plugin-service-")) {
    return err(new Error("Invalid temporary directory path"));
  }

  return ResultAsync.fromPromise(fs.rm(path, { recursive: true, force: true }), (err) =>
    wrapError(asError(err), `Failed to clean temporary directory`),
  );
}
