import { z } from "zod";

export const searchParams = z.object({
  page: z.number().default(1),
  search: z.string().optional(),
  perPage: z.number().default(10),
});

export type SearchParams = z.infer<typeof searchParams>;
