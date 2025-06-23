import type { Result } from "neverthrow";
import type { ZodSchema } from "zod";
import type z from "zod";
import type { EventTransformer } from "@/event-transporter/core";
import { err, ok } from "neverthrow";
import { wrapError } from "@/error";

export const masstransitTransformer = (): EventTransformer => {
  return {
    unwrap<T extends ZodSchema>(
      schema: T,
      data: unknown,
    ): Result<z.infer<T>, Error> {
      if (typeof data !== "string") {
        return err(new Error("Event data must be a string"));
      }

      const result = schema.safeParse(JSON.parse(data).message);
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
