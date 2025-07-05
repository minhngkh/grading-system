import { Label } from "@/components/ui/label";
import { GradingAnalyticsPage } from "@/pages/analytics/grading-analytics";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { ScrollableSelectMemo } from "@/components/app/scrollable-select";
import { GradingAttempt, GradingStatus } from "@/types/grading";
import { useCallback } from "react";
import PendingComponent from "@/components/app/route-pending";
import ErrorComponent from "@/components/app/route-error";
import {
  getGradingAttemptQueryOptions,
  getGradingSummaryQueryOptions,
  getInfiniteGradingAttemptsQueryOptions,
} from "@/queries/grading-queries";
import { useAuth } from "@clerk/clerk-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/analytics/")({
  component: RouteComponent,
  validateSearch: z.object({
    id: z.string().optional(),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps: { id }, context: { auth, queryClient } }) => {
    if (!id) return;
    queryClient.ensureQueryData(getGradingSummaryQueryOptions(id, auth));
    queryClient.ensureQueryData(getGradingAttemptQueryOptions(id, auth));
  },
  errorComponent: () => <ErrorComponent message="Failed to load grading analytics" />,
  pendingComponent: () => <PendingComponent message="Loading grading analytics..." />,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const auth = useAuth();

  const { data: gradingAnalytics } = useQuery(
    getGradingSummaryQueryOptions(Route.useSearch().id ?? "", auth, {
      placeholderData: keepPreviousData,
    }),
  );

  const { data: grading } = useQuery(
    getGradingAttemptQueryOptions(gradingAnalytics?.gradingId ?? "", auth, {
      placeholderData: keepPreviousData,
    }),
  );

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
            value={grading}
            onValueChange={(grading) => setSearchParam(grading.id)}
            queryOptionsFn={getInfiniteGradingAttemptsQueryOptions(auth, {
              status: GradingStatus.Graded,
            })}
            selectFn={(grading) =>
              `${grading.name} ${grading.createdAt.toLocaleDateString()}`
            }
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
