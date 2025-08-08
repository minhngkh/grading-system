import type { Result } from "neverthrow";
import { spawn } from "node:child_process";
import { err, fromSafePromise, ok } from "neverthrow";
import { CustomError } from "@/error";

type ExecutionResult = Result<
  {
    code: number;
    stdout: string;
    stderr: string;
  },
  ExecutionError
>;

class ExecutionError extends CustomError.withTag("ExecutionError")<{
  code?: number;
  command: string;
  stdout: string;
  stderr: string;
}> {}

export class LocalCommandExecutor {
  toolPath: string;

  constructor(options: { path: string }) {
    this.toolPath = options.path;
  }

  execute(
    input: string[],
    options?: {
      cwd?: string;
    },
  ) {
    return fromSafePromise(
      new Promise<ExecutionResult>((resolve) => {
        const proc = spawn(this.toolPath, input, {
          cwd: options?.cwd,
        });

        let outputData = "";
        let errorData = "";

        proc.stdout.on("data", (data) => {
          outputData += data.toString();
        });
        proc.stderr.on("data", (data) => {
          errorData += data.toString();
        });

        proc.on("error", (error) => {
          return resolve(
            err(
              new ExecutionError({
                message: error.message,
                data: {
                  command: [this.toolPath, ...input].join(" "),
                  stdout: outputData,
                  stderr: error.message,
                },
              }),
            ),
          );
        });

        proc.on("close", (code) => {
          if (code === 0) {
            return resolve(ok({ code, stdout: outputData, stderr: errorData }));
          }

          return resolve(
            err(
              new ExecutionError({
                data: {
                  command: [this.toolPath, ...input].join(" "),
                  code: code === null ? undefined : code,
                  stdout: outputData,
                  stderr: errorData,
                },
              }),
            ),
          );
        });
      }),
    ).andThen((value) => value);
  }
}
