import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { GradingAnalyticsPage } from "@/pages/analytics/grading-analytics";
import { GradingService } from "@/services/grading-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/$gradingId/analytics")({
  component: RouteComponent,
  loader: async ({ context: { auth }, params: { gradingId } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    return await GradingService.getGradingSummary(gradingId, token);
  },
  errorComponent: () => <ErrorComponent message="Failed to load grading analytics" />,
  pendingComponent: () => <PendingComponent message="Loading grading analytics..." />,
});

function RouteComponent() {
  const gradingAnalytics = Route.useLoaderData();
  return <GradingAnalyticsPage gradingAnalytics={gradingAnalytics} />;
}
