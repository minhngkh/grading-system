import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { RubricAssessmentUI } from "@/pages/assessment/edit-assessment";
import { AssessmentService } from "@/services/assessment-service";
import { GradingService } from "@/services/grading-service";
import { RubricService } from "@/services/rubric-service";
import { Assessment } from "@/types/assessment";
import { Rubric, RubricStatus } from "@/types/rubric";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/gradings/$gradingId/assessments/$assessmentId",
)({
  component: RouteComponent,
  loader: async ({ params: { assessmentId, gradingId }, context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const [grading, assessment] = await Promise.all([
      GradingService.getGradingAttempt(gradingId, token),
      AssessmentService.getAssessmentById(assessmentId, token),
    ]);
    if (grading.rubricId === undefined) {
      throw new Error("This assessment does not have a rubric associated with it.");
    }
    const rubric = await RubricService.getRubric(grading.rubricId, token);
    return { assessment, grading, rubric };
  },
  errorComponent: () => ErrorComponent("Failed to load assessment."),
  pendingComponent: () => PendingComponent("Loading assessment..."),
});

function RouteComponent() {
  const { assessment, grading, rubric } = Route.useLoaderData();
  return <RubricAssessmentUI assessment={assessment} grading={grading} rubric={rubric} />;
}
