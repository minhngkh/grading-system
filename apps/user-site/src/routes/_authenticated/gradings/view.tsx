import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import ManageGradingsPage from "@/pages/grading/manage-grading";
import { GradingService } from "@/services/grading-service";
import { searchParams, SearchParams } from "@/types/search-params";
import { createFileRoute, retainSearchParams, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

export const Route = createFileRoute("/_authenticated/gradings/view")({
  component: RouteComponent,
  validateSearch: searchParams,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    return await GradingService.getGradingAttempts(deps, token);
  },
  search: {
    middlewares: [retainSearchParams(["perPage", "page", "search"])],
  },
  errorComponent: () => ErrorComponent("Failed to load gradings"),
  pendingComponent: () => PendingComponent("Loading gradings..."),
});

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const rubricsData = Route.useLoaderData();

  const setSearchParam = useCallback((partial: Partial<SearchParams>) => {
    navigate({
      search: (prev) => {
        return {
          ...prev,
          search: partial.search?.trim() || undefined,
          page: partial.page || prev.page,
          perPage: partial.perPage || prev.perPage,
        };
      },
      replace: true,
    });
  }, []);

  return (
    <ManageGradingsPage
      results={rubricsData}
      searchParams={search}
      setSearchParam={setSearchParam}
    />
  );
}
