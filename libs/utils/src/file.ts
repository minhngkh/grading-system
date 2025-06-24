import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { CustomError } from "@/error";

class CheckDirectoryError extends CustomError<{ path: string }> {}

export function checkTempDirectoryExists(name: string) {
  const dirPath = path.join(os.tmpdir(), name);

  return ResultAsync.fromPromise(
    fs.access(dirPath),
    (error) =>
      new CheckDirectoryError({
        message: `directory doesn't exist or can't access`,
        options: { cause: error },
        data: { path: dirPath },
      }),
  ).map(() => dirPath);
}

class CreateDirectoryError extends CustomError<{ path: string }> {}
export function createDirectory(directoryPath: string, recursive = false) {
  return ResultAsync.fromPromise(
    fs.mkdir(directoryPath, { recursive: true }),
    (error) =>
      new CreateDirectoryError({
        message: `Failed to create directory`,
        options: { cause: error },
        data: { path: directoryPath },
      }),
  ).andThen((value) => {
    if (!recursive && value === undefined) {
      return errAsync(
        new CreateDirectoryError({
          message: `Failed to create directory`,
          data: { path: directoryPath },
        }),
      );
    }

    return okAsync();
  });
}

export function createDirectoryOnSystemTemp(name: string): ResultAsync<string, Error> {
  const dirPath = path.join(os.tmpdir(), name);

  return ResultAsync.fromPromise(
    fs.mkdir(dirPath),
    (error) =>
      new CreateDirectoryError({
        message: `Failed to create temporary directory`,
        options: { cause: error },
        data: { path: dirPath },
      }),
  ).map(() => dirPath);
}

export function createTempDirectory(prefix: string): ResultAsync<string, Error> {
  const dirPath = path.join(os.tmpdir(), prefix);

  return ResultAsync.fromPromise(
    fs.mkdtemp(path.join(os.tmpdir(), prefix)),
    (error) =>
      new CreateDirectoryError({
        message: `Failed to create temporary directory`,
        options: { cause: error },
        data: { path: dirPath },
      }),
  );
}

class DeleteFileError extends CustomError<{ path: string }> {}

export function deleteDirectory(directoryPath: string): ResultAsync<void, Error> {
  return ResultAsync.fromPromise(
    fs.rm(directoryPath, { recursive: true, force: true }),
    (err) =>
      new DeleteFileError({
        message: `Failed to delete directory`,
        options: { cause: err },
        data: { path: directoryPath },
      }),
  );
}

export function deleteFile(filePath: string): ResultAsync<void, Error> {
  return ResultAsync.fromPromise(
    fs.unlink(filePath),
    (err) =>
      new DeleteFileError({
        message: `Failed to delete file`,
        options: { cause: err },
        data: { path: filePath },
      }),
  );
}

class ReadFileError extends CustomError<{ path: string }> {}

export function readFile(filePath: string, encoding?: BufferEncoding) {
  return ResultAsync.fromPromise(
    fs.readFile(filePath, encoding),
    (err) =>
      new ReadFileError({
        message: `Failed to read file`,
        options: { cause: err },
        data: { path: filePath },
      }),
  );
}
