import ErrorComponent from "@/components/app/route-error";
import ManageGradingAttemptsPage from "@/pages/review/manage-grading";
import { getGradingAttempts } from "@/services/grading-service";
import { SearchParams, searchParams } from "@/types/searchParams";
import { createFileRoute, retainSearchParams, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_review/manage-grading")({
  component: RouteComponent,
  validateSearch: searchParams,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const { rowsPerPage, currentPage } = deps;
    return getGradingAttempts(currentPage, rowsPerPage);
  },
  search: {
    middlewares: [retainSearchParams(["rowsPerPage", "currentPage", "searchTerm"])],
  },
  errorComponent: () => ErrorComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const gradingsData = Route.useLoaderData();

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
    <ManageGradingAttemptsPage
      results={gradingsData}
      searchParams={search}
      setSearchParam={setSearchParam}
    />
  );
}
