import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import RubricGenerationPage from "@/pages/rubric/rubric-generation";
import { getRubricQueryOptions } from "@/queries/rubric-queries";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/_authenticated/rubrics/$id")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  loader: async ({ params: { id }, context: { auth, queryClient } }) =>
    queryClient.ensureQueryData(getRubricQueryOptions(id, auth)),
  onLeave: () => {
    sessionStorage.removeItem("rubricStep");
  },
  errorComponent: () => (
    <ErrorComponent message="Failed to load rubric. Please try again later." />
  ),
  pendingComponent: () => <PendingComponent message="Loading rubric..." />,
});

function RouteComponent() {
  const rubric = Route.useLoaderData();
  const rubricStep = sessionStorage.getItem("rubricStep") || undefined;
  return <RubricGenerationPage rubricStep={rubricStep} initialRubric={rubric} />;
}
