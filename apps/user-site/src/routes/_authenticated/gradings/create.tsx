import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import UploadAssignmentPage from "@/pages/grading/grading-session";
import { GradingService } from "@/services/grading-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/create")({
  component: RouteComponent,
  beforeLoad: async () => {
    let gradingId = sessionStorage.getItem("gradingId") ?? undefined;
    return { gradingId };
  },
  loader: async ({ context: { gradingId } }) => {
    if (!gradingId) {
      return await GradingService.createGradingAttempt();
    }

    return await GradingService.getGradingAttempt(gradingId);
  },
  onLeave: () => {
    sessionStorage.removeItem("gradingStep");
    sessionStorage.removeItem("gradingId");
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading grading..."),
});

function RouteComponent() {
  const gradingStep = sessionStorage.getItem("gradingStep") ?? undefined;
  const { gradingId } = Route.useRouteContext();
  const attempt = Route.useLoaderData();

  if (!gradingId) {
    sessionStorage.setItem("gradingId", attempt.id);
  }

  return (
    <UploadAssignmentPage initialStep={gradingStep} initialGradingAttempt={attempt} />
  );
}
