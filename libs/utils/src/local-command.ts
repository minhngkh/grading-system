import type { Result } from "neverthrow";
import { spawn } from "node:child_process";
import path from "node:path";
import { err, fromPromise, fromSafePromise, ok } from "neverthrow";
import { wrapError } from "@/error";

type ExecutionResult = Result<
  {
    code: number;
    stdout: string;
    stderr: string;
  },
  { message?: string; stderr: string }
>;

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
    return fromPromise(
      new Promise<ExecutionResult>((resolve) => {
        const process = spawn(this.toolPath, input, {
          cwd: options?.cwd,
        });

        let outputData = "";
        let errorData = "";

        process.stdout.on("data", (data) => {
          outputData += data.toString();
        });
        process.stderr.on("data", (data) => {
          errorData += data.toString();
        });

        process.on("error", (error) => {
          return resolve(err({ message: error.message, stderr: error.message }));
        });

        process.on("close", (code) => {
          if (code === 0) {
            return resolve(ok({ code, stdout: outputData, stderr: errorData }));
          }

          return resolve(err({ stderr: errorData }));
        });
      }),
      (error) => wrapError(error, "Failed to execute local command"),
    ).andThen((value) => value);
  }
}
