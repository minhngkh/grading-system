import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import ManageRubricsPage from "@/pages/rubric/manage-rubric";
import { RubricService } from "@/services/rubric-service";
import { SearchParams, searchParams } from "@/types/search-params";
import { createFileRoute, retainSearchParams, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rubrics/")({
  component: RouteComponent,
  validateSearch: searchParams,
  loaderDeps: ({ search }) => search,
  loader: ({ deps: { perPage, page, search } }) =>
    RubricService.getRubrics(page, perPage, search),
  search: {
    middlewares: [retainSearchParams(["perPage", "page", "search"])],
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
          search: partial.search?.trim() || undefined,
          page: partial.page || prev.page,
          perPage: partial.perPage || prev.perPage,
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
