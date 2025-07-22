import type { Result } from "neverthrow";
import type { ZodSchema } from "zod";
import type z from "zod";
import type { EventTransformer } from "@/event-transporter/core";
import { err, ok } from "neverthrow";
import { wrapError } from "@/error";

export const defaultTransformer = (): EventTransformer => {
  return {
    unwrap<T extends ZodSchema>(
      schema: T,
      data: unknown,
    ): Result<z.infer<T>, Error> {

      const result = schema.safeParse(data);
      if (result.success) {
        return ok(result.data);
      }

      return err(wrapError(result.error, "Invalid MassTransit event"));
    },
    wrap<T extends ZodSchema>(schema: T, data: z.infer<T>): object {
      return data;
    },
  };
};