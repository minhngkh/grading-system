import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import ManageGradingsPage from "@/pages/grading/manage-grading";
import { getGradingAttemptsQueryOptions } from "@/queries/grading-queries";
import { searchParams, SearchParams } from "@/types/search-params";
import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { useCallback } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/gradings/view")({
  component: RouteComponent,
  validateSearch: searchParams,
  search: {
    middlewares: [retainSearchParams(["perPage", "page", "search", "status"])],
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { auth } = Route.useRouteContext();

  const {
    data: gradingsData,
    isPending,
    error,
  } = useQuery(
    getGradingAttemptsQueryOptions(search, auth, {
      placeholderData: keepPreviousData,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  );

  console.log("Gradings data:", gradingsData);

  const setSearchParam = useCallback(
    (partial: Partial<SearchParams>) => {
      navigate({
        search: (prev: SearchParams) => {
          return {
            ...prev,
            ...partial,
          };
        },
        replace: true,
      });
    },
    [navigate],
  );

  if (isPending) {
    return <PendingComponent message="Loading gradings..." />;
  }

  if (error) {
    return <ErrorComponent message="Failed to load gradings" />;
  }

  if (!gradingsData) {
    return <ErrorComponent message="No data available" />;
  }

  return (
    <ManageGradingsPage
      results={gradingsData}
      searchParams={search}
      setSearchParam={setSearchParam}
    />
  );
}
