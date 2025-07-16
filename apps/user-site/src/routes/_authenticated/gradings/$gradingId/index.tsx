import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import UploadAssignmentPage from "@/pages/grading/grading-session";
import { getGradingAttemptQueryOptions } from "@/queries/grading-queries";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/gradings/$gradingId/")({
  component: RouteComponent,
  loaderDeps: (ctx) => ctx.search,
  onLeave: () => sessionStorage.removeItem("gradingStep"),
});

function RouteComponent() {
  const { gradingId } = Route.useParams();
  const { auth } = Route.useRouteContext();
  const gradingStep = sessionStorage.getItem("gradingStep") || undefined;

  const {
    data: gradingAttempt,
    isPending,
    error,
  } = useQuery(
    getGradingAttemptQueryOptions(gradingId, auth, {
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  );

  if (isPending) {
    return <PendingComponent message="Loading grading session..." />;
  }

  if (error) {
    return <ErrorComponent message="Failed to load grading session" />;
  }

  if (!gradingAttempt) {
    return <PendingComponent message="Loading grading session..." />;
  }

  return (
    <UploadAssignmentPage
      initialGradingAttempt={gradingAttempt}
      initialStep={gradingStep}
    />
  );
}
