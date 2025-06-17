import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { wrapError } from "@grading-system/utils/error";
import { errAsync, ResultAsync } from "neverthrow";

const PREFIX = "plugin-service";

export function checkDirectoryExists(tag: string): ResultAsync<string, Error> {
  const dirPath = path.join(os.tmpdir(), `${PREFIX}-${tag}`);

  return ResultAsync.fromPromise(fs.access(dirPath), (error) =>
    wrapError(error, `Directory doesn't exit at ${dirPath}`),
  ).map(() => dirPath);
}

export function createDirectoryOnSystemTemp(tag: string): ResultAsync<string, Error> {
  const dirPath = path.join(os.tmpdir(), `${PREFIX}-${tag}`);

  return ResultAsync.fromPromise(fs.mkdir(dirPath), (error) =>
    wrapError(error, `Failed to create directory at ${dirPath}`),
  ).map(() => dirPath);
}

export function createTempDirectory(tag?: string): ResultAsync<string, Error> {
  const prefix = tag ? `${PREFIX}-${tag}-` : `${PREFIX}-`;

  return ResultAsync.fromPromise(fs.mkdtemp(path.join(os.tmpdir(), prefix)), (error) =>
    wrapError(error, `Failed to create temporary directory`),
  );
}

export function cleanTempDirectory(path: string): ResultAsync<void, Error> {
  if (!path.includes(PREFIX)) {
    return errAsync(new Error("Invalid temporary directory path"));
  }

  return ResultAsync.fromPromise(fs.rm(path, { recursive: true, force: true }), (err) =>
    wrapError(err, `Failed to clean temporary directory`),
  );
}

export function deleteDirectory(path: string): ResultAsync<void, Error> {
  return ResultAsync.fromPromise(fs.rm(path, { recursive: true, force: true }), (err) =>
    wrapError(err, `Failed to delete directory at ${path}`),
  );
}

export function deleteFile(filePath: string): ResultAsync<void, Error> {
  return ResultAsync.fromPromise(fs.unlink(filePath), (err) =>
    wrapError(err, `Failed to delete file at ${filePath}`),
  );
}
