import ManageAssessmentsPage from "@/pages/review/manage-assessments/$id";
import { getGradingAttempt } from "@/services/grading-service";
import { createFileRoute, ErrorComponent, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_review/manage-assessments/$id")({
  component: RouteComponent,
  loaderDeps: ({ search }) => search,
  loader: async ({ params }) => {
    const gradingId = params.id;
    const result = await getGradingAttempt(gradingId);
    if (!result) {
      throw new Error("Grading attempt not found");
    }
    return result;
  },
  errorComponent: () => ErrorComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const gradingsData = Route.useLoaderData();

  return <ManageAssessmentsPage gradingAttempt={gradingsData} />;
}
