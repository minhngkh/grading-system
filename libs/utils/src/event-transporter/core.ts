import type { Result, ResultAsync } from "neverthrow";
import type { ZodSchema } from "zod";
import type z from "zod";
import { err } from "neverthrow";
import { wrapError } from "@/error";

export type ServiceEvent<T extends ZodSchema = ZodSchema> = {
  name: string;
  schema: T;
};

export interface EventTransformer {
  unwrap: <T extends ZodSchema>(schema: T, data: unknown) => Result<z.infer<T>, Error>;
  wrap: <T extends ZodSchema>(schema: T, data: z.infer<T>) => object;
}

export abstract class EventTransporter {
  private transformer: EventTransformer;
  constructor(options: { transformer: EventTransformer }) {
    this.transformer = options.transformer;
  }

  async emit<T extends ZodSchema>(
    event: ServiceEvent<T>,
    data: z.infer<T>,
    callback?: (isError: boolean) => void,
  ): Promise<void> {
    const wrappedData = this.transformer.wrap(event.schema, data);
    await this.doEmit(event, wrappedData, callback);
  }

  /**
   * Return err in handler to reject the message
   *
   * @param event
   * @param handler
   */
  async consume<T extends ZodSchema>(
    event: ServiceEvent<T>,
    handler: (
      data: z.infer<T>,
    ) => Result<unknown, unknown> | ResultAsync<unknown, unknown>,
  ): Promise<void> {
    await this.doConsume(event, (data) => {
      const unwrappedData = this.transformer.unwrap(event.schema, data);
      if (unwrappedData.isErr()) {
        return err(wrapError(unwrappedData.error, `Failed to unwrap data for event`));
      }

      return handler(unwrappedData.value);
    });
  }

  /**
   * Throw if can't bind
   *
   * @param event
   * @param data
   * @param callback
   */
  protected abstract doEmit<T extends ZodSchema>(
    event: ServiceEvent<T>,
    data: object,
    callback?: (isError: boolean) => void,
  ): Promise<void>;

  /**
   * Throw if can't bind
   *
   * @param event
   * @param handler
   */
  protected abstract doConsume<T extends ZodSchema>(
    event: ServiceEvent<T>,
    handler: (data: unknown) => Result<unknown, unknown> | ResultAsync<unknown, unknown>,
  ): Promise<void>;
}
