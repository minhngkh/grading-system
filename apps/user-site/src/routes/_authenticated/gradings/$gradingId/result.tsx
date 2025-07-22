import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { Button } from "@/components/ui/button";
import GradingResult from "@/pages/grading/grading-result";
import { getAllGradingAssessmentsQueryOptions } from "@/queries/assessment-queries";
import { getGradingAttemptQueryOptions } from "@/queries/grading-queries";
import { GradingStatus } from "@/types/grading";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/$gradingId/result")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { gradingId } = Route.useParams();
  const { auth } = Route.useRouteContext();

  const {
    data: gradingAttempt,
    isPending: isFetchingGradingAttempt,
    error: gradingAttemptError,
  } = useQuery(getGradingAttemptQueryOptions(gradingId, auth));

  const {
    data: assessmentsData,
    isPending: isFetchingAssessmentsData,
    error: assessmentsDataError,
  } = useQuery(getAllGradingAssessmentsQueryOptions(gradingId, auth));

  if (
    (isFetchingGradingAttempt && !gradingAttempt) ||
    (isFetchingAssessmentsData && !assessmentsData)
  ) {
    return <PendingComponent message="Loading grading result..." />;
  }

  if (gradingAttemptError || assessmentsDataError) {
    return <ErrorComponent message="Failed to load grading result" />;
  }

  if (!gradingAttempt || !assessmentsData) {
    return <ErrorComponent message="Failed to load grading result" />;
  }

  if (gradingAttempt.status === GradingStatus.Created)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-lg font-semibold">The grading session has not started yet.</p>
        <Button variant="destructive" onClick={() => router.history.back()}>
          Return
        </Button>
      </div>
    );

  return (
    <GradingResult gradingAttempt={gradingAttempt} assessmentsData={assessmentsData} />
  );
}
