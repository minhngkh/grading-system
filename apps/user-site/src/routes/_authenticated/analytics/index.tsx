import { Label } from "@/components/ui/label";
import { GradingAnalyticsPage } from "@/pages/analytics/grading-analytics";
import { GradingService } from "@/services/grading-service";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { ScrollableSelectMemo } from "@/components/app/scrollable-select";
import { GradingAttempt, GradingStatus } from "@/types/grading";
import { useCallback } from "react";
import PendingComponent from "@/components/app/route-pending";
import ErrorComponent from "@/components/app/route-error";
import { getInfiniteGradingAttemptsQueryOptions } from "@/queries/grading-queries";
import { useAuth } from "@clerk/clerk-react";

const searchParams = z.object({
  id: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/analytics/")({
  component: RouteComponent,
  validateSearch: searchParams,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps: { id }, context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    if (!id) return null;
    return GradingService.getGradingSummary(id, token);
  },
  errorComponent: () => <ErrorComponent message="Failed to load grading analytics" />,
  pendingComponent: () => <PendingComponent message="Loading grading analytics..." />,
});

function RouteComponent() {
  const gradingAnalytics = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const auth = useAuth();

  const setSearchParam = useCallback(
    (newId?: string) => {
      if (newId === gradingAnalytics?.gradingId) return;

      navigate({
        search: (prev) => {
          return {
            ...prev,
            id: newId,
          };
        },
        replace: true,
      });
    },
    [navigate],
  );

  return (
    <div className="flex flex-col size-full gap-8">
      <div className="flex md:flex-row flex-col gap-2 md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            View detailed grading analytics and performance insights.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Label>View grading:</Label>
          <ScrollableSelectMemo<GradingAttempt>
            value={gradingAnalytics?.gradingId}
            onValueChange={(grading) => setSearchParam(grading.id)}
            queryOptionsFn={getInfiniteGradingAttemptsQueryOptions(auth, {
              status: GradingStatus.Graded,
            })}
            selectFn={(grading) => grading.id}
          />
        </div>
      </div>
      {!gradingAnalytics ?
        <div className="flex items-center justify-center flex-1">
          <p className="text-muted-foreground font-semibold text-lg">
            No grading analytics to view. Please select a grading to view analytics.
          </p>
        </div>
      : <GradingAnalyticsPage gradingAnalytics={gradingAnalytics} />}
    </div>
  );
}
