import { z } from "zod";

export const searchParams = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
});

export type SearchParams = z.infer<typeof searchParams>;
export type GetAllResult<T> = {
  data: T[];
  meta: {
    total: number;
    next?: string;
  };
};
