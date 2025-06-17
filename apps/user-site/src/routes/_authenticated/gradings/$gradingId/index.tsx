import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import UploadAssignmentPage from "@/pages/grading/grading-session";
import { GradingService } from "@/services/grading-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/$gradingId/")({
  component: RouteComponent,
  loader: async ({ params: { gradingId }, context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("You must be logged in to view grading session.");
    }

    return await GradingService.getGradingAttempt(gradingId, token);
  },
  onLeave: () => {
    sessionStorage.removeItem("gradingStep");
  },
  errorComponent: () => ErrorComponent("Failed to load grading session."),
  pendingComponent: () => PendingComponent("Loading grading session..."),
});

function RouteComponent() {
  const gradingAttempt = Route.useLoaderData();
  const gradingStep = sessionStorage.getItem("gradingStep") || undefined;
  return (
    <UploadAssignmentPage
      initialGradingAttempt={gradingAttempt}
      initialStep={gradingStep}
    />
  );
}
