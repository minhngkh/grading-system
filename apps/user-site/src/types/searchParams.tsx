import { z } from "zod";

export const searchParams = z.object({
  currentPage: z.number().default(1),
  searchTerm: z.string().optional(),
  rowsPerPage: z.number().default(10),
});

export type SearchParams = z.infer<typeof searchParams>;
