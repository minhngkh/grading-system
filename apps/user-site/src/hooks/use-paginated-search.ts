import { useState, useEffect } from "react";
import { SearchParams, GetAllResult } from "../types/search-params";
import { toast } from "sonner";
import { useAuth } from "@clerk/clerk-react";

type Auth = ReturnType<typeof useAuth>;

type FnWithSearchAuth<T, MiddleArgs extends any[]> = (
  searchParams: SearchParams,
  ...args: [...MiddleArgs, string]
) => T;

export function usePaginatedSearch<T, MiddleArgs extends any[]>(
  searchFn: FnWithSearchAuth<Promise<GetAllResult<T>>, MiddleArgs>,
  auth: Auth,
  ...middleArgs: MiddleArgs
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const totalPages = Math.ceil(total / perPage);

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      const token = await auth.getToken();
      if (!token) return;

      setLoading(true);
      try {
        const result = await searchFn(
          {
            page: currentPage,
            perPage,
            search: search || undefined,
            status: status || undefined,
          },
          ...middleArgs,
          token,
        );
        if (!isCancelled) {
          setData(result.data);
          setTotal(result.meta.total);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch data. Please try again.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, perPage, search, status, ...middleArgs, searchFn]);

  return {
    data,
    loading,
    currentPage,
    perPage,
    totalPages,
    search,
    status,
    setPage: setCurrentPage,
    setPerPage,
    setSearch,
    setStatus,
  };
}
