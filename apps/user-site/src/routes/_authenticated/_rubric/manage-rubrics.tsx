import ErrorComponent from "@/components/app/route-error";
import ManageRubricsPage from "@/pages/rubric/manage-rubrics";
import { getRubrics } from "@/services/rubric-service";
import { SearchParams, searchParams } from "@/types/searchParams";
import { createFileRoute, retainSearchParams, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_rubric/manage-rubrics")({
  component: RouteComponent,
  validateSearch: searchParams,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const { rowsPerPage, currentPage, searchTerm } = deps;
    return getRubrics(currentPage, rowsPerPage, searchTerm);
  },
  search: {
    middlewares: [retainSearchParams(["rowsPerPage", "currentPage", "searchTerm"])],
  },
  errorComponent: () => ErrorComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const rubricsData = Route.useLoaderData();

  const setSearchParam = (partial: Partial<SearchParams>) => {
    navigate({
      search: (prev) => {
        return {
          ...prev,
          searchTerm: partial.searchTerm?.trim() || undefined,
          currentPage: partial.currentPage || prev.currentPage,
          rowsPerPage: partial.rowsPerPage || prev.rowsPerPage,
        };
      },
      replace: true,
    });
  };

  return (
    <ManageRubricsPage
      results={rubricsData}
      searchParams={search}
      setSearchParam={setSearchParam}
    />
  );
}
