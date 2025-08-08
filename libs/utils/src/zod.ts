import type { Result } from "neverthrow";
import type { z, ZodSchema } from "zod";
import { err, ok } from "neverthrow";
import { CustomError } from "@/error";

export class ZodParseError extends CustomError.withTag("ZodParseError")<
  void,
  z.ZodError
> {}

export function zodParse<T extends ZodSchema>(
  data: unknown,
  schema: T,
): Result<z.infer<T>, ZodParseError> {
  const result = schema.safeParse(data);
  if (!result.success) {
    return err(
      new ZodParseError({
        message: "Zod schema validation failed",
        cause: result.error,
      }),
    );
  }
  return ok(result.data);
}
