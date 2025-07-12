import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import ManageRubricsPage from "@/pages/rubric/manage-rubric";
import { getRubricsQueryOptions } from "@/queries/rubric-queries";
import { SearchParams, searchParams } from "@/types/search-params";
import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { useCallback } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/rubrics/view")({
  component: RouteComponent,
  validateSearch: searchParams,
  loaderDeps: ({ search }) => search,
  loader: ({ deps, context: { auth, queryClient } }) =>
    queryClient.ensureQueryData(getRubricsQueryOptions(deps, auth)),
  search: {
    middlewares: [retainSearchParams(["perPage", "page", "search"])],
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { auth } = Route.useRouteContext();

  const {
    data: rubricsData,
    isFetching,
    error,
  } = useQuery(
    getRubricsQueryOptions(search, auth, {
      placeholderData: keepPreviousData,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  );

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

  if (isFetching && !rubricsData) {
    return <PendingComponent message="Loading rubrics..." />;
  }

  if (error) {
    return <ErrorComponent message="Failed to load rubrics. Please try again later." />;
  }

  if (!rubricsData) {
    return <ErrorComponent message="No data available" />;
  }

  return (
    <ManageRubricsPage
      results={rubricsData}
      searchParams={search}
      setSearchParam={setSearchParam}
    />
  );
}
