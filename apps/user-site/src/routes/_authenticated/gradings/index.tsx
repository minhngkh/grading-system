import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import ManageGradingsPage from "@/pages/review/manage-grading";
import { GradingService } from "@/services/grading-service";
import { searchParams, SearchParams } from "@/types/search-params";
import { createFileRoute, retainSearchParams, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/")({
  component: RouteComponent,
  validateSearch: searchParams,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const { rowsPerPage, currentPage, searchTerm } = deps;
    return GradingService.getGradingAttempts(currentPage, rowsPerPage, searchTerm);
  },
  search: {
    middlewares: [retainSearchParams(["rowsPerPage", "currentPage", "searchTerm"])],
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading rubrics..."),
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
    <ManageGradingsPage
      results={rubricsData}
      searchParams={search}
      setSearchParam={setSearchParam}
    />
  );
}
