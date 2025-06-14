import { GradingAnalyticsPage } from "@/pages/review/analytics/grading-analytics";
import { GradingAnalytics } from "@/types/analytics";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/$gradingId/analytics")({
  component: RouteComponent,
  loader: async () => {
    const gradingAnalytics: GradingAnalytics = {
      gradingId: "grading-123",
      scaleFactor: 10,
      averageScore: 0.72,
      assessmentCount: 45,
      scoreDistribution: [0, 1, 2, 5, 10, 15, 8, 3, 1, 0],
      criterionData: [
        {
          criterionName: "Critical Thinking",
          totalWeight: 0.4,
          scoreDistribution: [0, 0, 1, 3, 10, 20, 8, 2, 1, 0],
        },
        {
          criterionName: "Communication",
          totalWeight: 0.3,
          scoreDistribution: [0, 2, 3, 4, 15, 12, 5, 3, 1, 0],
        },
        {
          criterionName: "Technical Skills",
          totalWeight: 0.3,
          scoreDistribution: [0, 1, 2, 4, 8, 10, 5, 3, 1, 0],
        },
      ],
    };
    return { gradingAnalytics };
  },
});

function RouteComponent() {
  const { gradingAnalytics } = Route.useLoaderData();
  return <GradingAnalyticsPage gradingAnalytics={gradingAnalytics} />;
}
