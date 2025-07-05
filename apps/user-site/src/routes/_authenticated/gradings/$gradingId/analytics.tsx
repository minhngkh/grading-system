import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { GradingAnalyticsPage } from "@/pages/analytics/grading-analytics";
import { getGradingSummaryQueryOptions } from "@/queries/grading-queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/$gradingId/analytics")({
  component: RouteComponent,
  loader: async ({ context: { auth, queryClient }, params: { gradingId } }) =>
    queryClient.ensureQueryData(getGradingSummaryQueryOptions(gradingId, auth)),
  errorComponent: () => <ErrorComponent message="Failed to load grading analytics" />,
  pendingComponent: () => <PendingComponent message="Loading grading analytics..." />,
});

function RouteComponent() {
  const gradingAnalytics = Route.useLoaderData();
  return <GradingAnalyticsPage gradingAnalytics={gradingAnalytics} />;
}
