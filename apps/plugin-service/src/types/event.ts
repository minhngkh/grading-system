import type z from "zod";

export type ServiceEvent<
  T extends z.ZodObject<any, any, any> = z.ZodObject<any, any, any>,
> = {
  name: string;
  schema: T;
};
