import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { OverallAnalyticsPage } from "@/pages/analytics/overall-analytics";
import { GradingService } from "@/services/grading-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: PageComponent,
  loader: async ({ context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    return await GradingService.getAllGradingsSummary(token);
  },
  errorComponent: () => ErrorComponent("Failed to load analytics."),
  pendingComponent: () => PendingComponent("Loading analytics..."),
});

function PageComponent() {
  const analytics = Route.useLoaderData();
  return <OverallAnalyticsPage analytics={analytics} />;
}
