import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import ManageRubricsPage from "@/pages/rubric/manage-rubric";
import { getRubricsQueryOptions } from "@/queries/rubric-queries";
import { SearchParams, searchParams } from "@/types/search-params";
import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { useCallback } from "react";

export const Route = createFileRoute("/_authenticated/rubrics/view")({
  component: RouteComponent,
  validateSearch: searchParams,
  loaderDeps: ({ search }) => search,
  loader: ({ deps, context: { auth, queryClient } }) =>
    queryClient.fetchQuery(getRubricsQueryOptions(deps, auth)),
  search: {
    middlewares: [retainSearchParams(["perPage", "page", "search"])],
  },
  errorComponent: () => (
    <ErrorComponent message="Failed to load rubrics. Please try again later." />
  ),
  pendingComponent: () => <PendingComponent message="Loading rubrics..." />,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const rubricsData = Route.useLoaderData();

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
    <ManageRubricsPage
      results={rubricsData}
      searchParams={search}
      setSearchParam={setSearchParam}
    />
  );
}
