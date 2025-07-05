import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import UploadAssignmentPage from "@/pages/grading/grading-session";
import { getGradingAttemptQueryOptions } from "@/queries/grading-queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/$gradingId/")({
  component: RouteComponent,
  loaderDeps: (ctx) => ctx.search,
  loader: async ({ params: { gradingId }, context: { auth, queryClient } }) =>
    queryClient.ensureQueryData(getGradingAttemptQueryOptions(gradingId, auth)),
  onLeave: () => {
    sessionStorage.removeItem("gradingStep");
  },
  errorComponent: () => <ErrorComponent message="Failed to load grading session" />,
  pendingComponent: () => <PendingComponent message="Loading grading session..." />,
});

function RouteComponent() {
  const gradingAttempt = Route.useLoaderData();
  const gradingStep = sessionStorage.getItem("gradingStep") || undefined;
  return (
    <UploadAssignmentPage
      initialGradingAttempt={gradingAttempt}
      initialStep={gradingStep}
    />
  );
}
