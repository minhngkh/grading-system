import { Label } from "@/components/ui/label";
import { GradingAnalyticsPage } from "@/pages/analytics/grading-analytics";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { ScrollableSelectMemo } from "@/components/app/scrollable-select";
import { GradingAttempt, GradingStatus } from "@/types/grading";
import { useCallback } from "react";
import ErrorComponent from "@/components/app/route-error";
import {
  getGradingAttemptQueryOptions,
  getGradingSummaryQueryOptions,
  getInfiniteGradingAttemptsQueryOptions,
} from "@/queries/grading-queries";
import { useAuth } from "@clerk/clerk-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import PendingComponent from "@/components/app/route-pending";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: RouteComponent,
  validateSearch: z.object({
    id: z.string().optional(),
  }),
  loaderDeps: ({ search }) => search,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const auth = useAuth();
  const { id } = Route.useSearch();

  const {
    data: gradingAnalytics,
    isError: gradingAnalyticsError,
    isLoading,
  } = useQuery(
    getGradingSummaryQueryOptions(id ?? "", auth, {
      placeholderData: keepPreviousData,
    }),
  );

  const { data: gradingAttempt } = useQuery(
    getGradingAttemptQueryOptions(id ?? "", auth, {
      placeholderData: keepPreviousData,
    }),
  );

  const setSearchParam = useCallback(
    (newId?: string) => {
      if (newId === id) return;

      navigate({
        search: { id: newId ?? undefined },
        replace: true,
      });
    },
    [navigate],
  );

  if (gradingAnalyticsError) {
    return <ErrorComponent message="Failed to load grading analytics" />;
  }

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
            value={gradingAttempt}
            onValueChange={(grading) => setSearchParam(grading.id)}
            queryOptionsFn={getInfiniteGradingAttemptsQueryOptions(auth, {
              status: GradingStatus.Graded,
            })}
            selectFn={(grading) =>
              `${grading.name} - ${grading.createdAt.toLocaleString()}`
            }
          />
        </div>
      </div>
      {isLoading ?
        <PendingComponent message="Loading grading analytics..." />
      : !gradingAnalytics ?
        <div className="flex items-center justify-center flex-1">
          <p className="text-muted-foreground font-semibold text-lg">
            No grading analytics to view. Please select a grading to view analytics.
          </p>
        </div>
      : !gradingAttempt ?
        <ErrorComponent message="Failed to get grading session data" />
      : <GradingAnalyticsPage
          gradingAnalytics={gradingAnalytics}
          grading={gradingAttempt}
        />
      }
    </div>
  );
}
