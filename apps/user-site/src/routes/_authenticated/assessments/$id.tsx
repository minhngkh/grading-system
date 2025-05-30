import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import ManualAdjustScore from "@/pages/grading/manual-grade";
import { AssessmentService } from "@/services/assessment-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/assessments/$id")({
  component: RouteComponent,
  loader: ({ params: { id } }) => AssessmentService.getAssessmentById(id),
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading assessment..."),
});

function RouteComponent() {
  const assessment = Route.useLoaderData();
  return <ManualAdjustScore />;
}
