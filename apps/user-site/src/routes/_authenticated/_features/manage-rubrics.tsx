import ManageRubricsPage from "@/pages/features/manage-rubrics";
import { getRubrics } from "@/services/rubricService";
import { SearchParams, searchParams } from "@/types/searchParams";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_features/manage-rubrics")({
  component: RouteComponent,
  validateSearch: searchParams,
  loaderDeps: ({ search: { rowsPerPage, currentPage, searchTerm } }) => ({
    rowsPerPage,
    currentPage,
    searchTerm,
  }),
  loader: async ({ deps: { rowsPerPage, currentPage, searchTerm } }) =>
    getRubrics(currentPage, rowsPerPage, searchTerm),
});

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const rubricsData = Route.useLoaderData();

  const setSearchParam = (partial: Partial<SearchParams>) => {
    navigate({
      search: (prev) => {
        const newSearch = { ...prev };
        // Only include searchTerm if it's not null/empty
        if (partial.searchTerm?.trim()) {
          newSearch.searchTerm = partial.searchTerm;
        } else {
          delete newSearch.searchTerm;
        }
        // Include other params
        if (partial.currentPage) newSearch.currentPage = partial.currentPage;
        if (partial.rowsPerPage) newSearch.rowsPerPage = partial.rowsPerPage;

        return searchParams.parse(newSearch);
      },
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
