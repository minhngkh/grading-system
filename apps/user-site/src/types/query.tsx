import { GetAllResult, SearchParams } from "@/types/search-params";
import { InfiniteData, UseInfiniteQueryOptions } from "@tanstack/react-query";

export type InfiniteQueryOption<T> = UseInfiniteQueryOptions<
  GetAllResult<T>,
  unknown,
  InfiniteData<GetAllResult<T>>,
  [string, SearchParams],
  number
>;
