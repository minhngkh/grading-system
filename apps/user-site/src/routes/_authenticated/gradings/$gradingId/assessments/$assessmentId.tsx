import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { EditAssessmentUI } from "@/pages/assessment/edit-assessment";
import { getAssessmentQueryOptions } from "@/queries/assessment-queries";
import { getGradingAttemptQueryOptions } from "@/queries/grading-queries";
import { getRubricQueryOptions } from "@/queries/rubric-queries";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const Route = createFileRoute(
  "/_authenticated/gradings/$gradingId/assessments/$assessmentId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { assessmentId, gradingId } = Route.useParams();
  const { auth } = Route.useRouteContext();

  const {
    data: assessment,
    isPending: isFetchingAssessment,
    error: assessmentError,
  } = useQuery(getAssessmentQueryOptions(assessmentId, auth));

  const {
    data: grading,
    isPending: isFetchingGrading,
    error: gradingError,
  } = useQuery(
    getGradingAttemptQueryOptions(gradingId, auth, {
      placeholderData: keepPreviousData,
    }),
  );

  const {
    data: rubric,
    isPending: isFetchingRubric,
    error: rubricError,
  } = useQuery(
    getRubricQueryOptions(grading?.rubricId || "", auth, {
      placeholderData: keepPreviousData,
    }),
  );

  if (isFetchingAssessment || isFetchingGrading || isFetchingRubric) {
    return <PendingComponent message="Loading assessment..." />;
  }

  if (assessmentError || gradingError || rubricError) {
    return <ErrorComponent message="Failed to load assessment" />;
  }

  if (!assessment || !grading || !rubric) {
    return <ErrorComponent message="Assessment, grading, or rubric data is missing" />;
  }

  return <EditAssessmentUI assessment={assessment} grading={grading} rubric={rubric} />;
}
