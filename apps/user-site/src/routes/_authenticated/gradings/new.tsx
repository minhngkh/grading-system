import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import UploadAssignmentPage from "@/pages/grading/grading-session";
import { GradingService } from "@/services/grading-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/new")({
  component: RouteComponent,
  beforeLoad: async () => {
    let gradingId = sessionStorage.getItem("gradingId") ?? undefined;
    if (!gradingId) {
      gradingId = await GradingService.createGradingAttempt();
      sessionStorage.setItem("gradingId", gradingId);
    }

    return { gradingId };
  },
  loader: ({ context: { gradingId } }) => GradingService.getGradingAttempt(gradingId),
  onLeave: () => {
    sessionStorage.removeItem("gradingStep");
    sessionStorage.removeItem("gradingId");
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading grading..."),
});

function RouteComponent() {
  const gradingStep = sessionStorage.getItem("gradingStep") ?? undefined;
  const attempt = Route.useLoaderData();
  return (
    <UploadAssignmentPage initalStep={gradingStep} initialGradingAttempt={attempt} />
  );
}
