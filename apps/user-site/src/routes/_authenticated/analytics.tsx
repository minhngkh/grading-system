import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { OverallAnalyticsPage } from "@/pages/analytics/overall-analytics";
import { OverallGradingAnalytics } from "@/types/analytics";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: PageComponent,
  loader: async () => {
    const analytics: OverallGradingAnalytics = {
      totalGradingCount: 50,
      totalAssessmentCount: 1800,
      averageScore: 0.637,
      gradingDistribution: [0, 2, 5, 12, 18, 7, 4, 1, 1, 0],
    };
    return { analytics };
  },
  errorComponent: () => ErrorComponent("Failed to load analytics."),
  pendingComponent: () => PendingComponent("Loading analytics..."),
});

function PageComponent() {
  const { analytics } = Route.useLoaderData();
  return <OverallAnalyticsPage analytics={analytics} />;
}
