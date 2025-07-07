import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import ManageGradingsPage from "@/pages/grading/manage-grading";
import { getGradingAttemptsQueryOptions } from "@/queries/grading-queries";
import { searchParams, SearchParams } from "@/types/search-params";
import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { useCallback } from "react";

export const Route = createFileRoute("/_authenticated/gradings/view")({
  component: RouteComponent,
  validateSearch: searchParams,
  loaderDeps: ({ search }) => search,
  loader: ({ deps, context: { auth, queryClient } }) =>
    queryClient.fetchQuery(getGradingAttemptsQueryOptions(deps, auth)),
  search: {
    middlewares: [retainSearchParams(["perPage", "page", "search", "status"])],
  },
  errorComponent: () => <ErrorComponent message="Failed to load gradings" />,
  pendingComponent: () => <PendingComponent message="Loading gradings..." />,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const gradingsData = Route.useLoaderData();

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

  return (
    <ManageGradingsPage
      results={gradingsData}
      searchParams={search}
      setSearchParam={setSearchParam}
    />
  );
}
