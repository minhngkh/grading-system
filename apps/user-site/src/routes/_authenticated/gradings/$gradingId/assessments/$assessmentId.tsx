import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { EditAssessmentUI } from "@/pages/assessment/edit-assessment";
import { getAssessmentQueryOptions } from "@/queries/assessment-queries";
import { getGradingAttemptQueryOptions } from "@/queries/grading-queries";
import { getRubricQueryOptions } from "@/queries/rubric-queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/gradings/$gradingId/assessments/$assessmentId",
)({
  component: RouteComponent,
  loader: async ({
    params: { assessmentId, gradingId },
    context: { auth, queryClient },
  }) => {
    const [grading, assessment] = await Promise.all([
      queryClient.ensureQueryData(getGradingAttemptQueryOptions(gradingId, auth)),
      queryClient.ensureQueryData(getAssessmentQueryOptions(assessmentId, auth)),
    ]);

    const rubric = await queryClient.ensureQueryData(
      getRubricQueryOptions(grading.rubricId, auth),
    );

    return { assessment, grading, rubric };
  },
  errorComponent: () => <ErrorComponent message="Failed to load assessment" />,
  pendingComponent: () => <PendingComponent message="Loading assessment..." />,
});

function RouteComponent() {
  const { assessment, grading, rubric } = Route.useLoaderData();
  return <EditAssessmentUI assessment={assessment} grading={grading} rubric={rubric} />;
}
