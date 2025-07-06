import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { Button } from "@/components/ui/button";
import GradingResult from "@/pages/grading/grading-result";
import { getAllGradingAssessmentsQueryOptions } from "@/queries/assessment-queries";
import { getGradingAttemptQueryOptions } from "@/queries/grading-queries";
import { GradingStatus } from "@/types/grading";
import { keepPreviousData } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/$gradingId/result")({
  component: RouteComponent,
  loader: async ({ params: { gradingId }, context: { auth, queryClient } }) => {
    const [gradingAttempt, assessmentsData] = await Promise.all([
      queryClient.ensureQueryData(
        getGradingAttemptQueryOptions(gradingId, auth, {
          staleTime: Infinity,
        }),
      ),
      queryClient.ensureQueryData(
        getAllGradingAssessmentsQueryOptions(gradingId, auth, {
          placeholderData: keepPreviousData,
          staleTime: 1000 * 60 * 5, // 5 minutes
        }),
      ),
    ]);

    return { gradingAttempt, assessmentsData };
  },
  errorComponent: () => <ErrorComponent message="Failed to load grading result" />,
  pendingComponent: () => <PendingComponent message="Loading grading result..." />,
});

function RouteComponent() {
  const router = useRouter();
  const { gradingAttempt, assessmentsData } = Route.useLoaderData();

  if (
    gradingAttempt.status === GradingStatus.Created ||
    gradingAttempt.status === GradingStatus.Started
  )
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-lg font-semibold">
          The grading session is under grading or have not started yet.
        </p>
        <Button variant="destructive" onClick={() => router.history.back()}>
          Return
        </Button>
      </div>
    );

  return (
    <GradingResult gradingAttempt={gradingAttempt} assessmentsData={assessmentsData} />
  );
}
