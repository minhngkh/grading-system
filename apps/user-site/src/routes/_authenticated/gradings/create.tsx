import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import UploadAssignmentPage from "@/pages/grading/grading-session";
import { GradingService } from "@/services/grading-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/create")({
  component: RouteComponent,
  loader: async ({ context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("You must be logged in to create a grading session.");
    }

    const id = sessionStorage.getItem("gradingId");
    if (!id) {
      return await GradingService.createGradingAttempt(token);
    }

    return await GradingService.getGradingAttempt(id, token);
  },
  onLeave: () => {
    sessionStorage.removeItem("gradingStep");
    sessionStorage.removeItem("gradingId");
  },
  errorComponent: () => ErrorComponent("Failed to initialize grading session."),
  pendingComponent: () => PendingComponent("Initializing grading session..."),
});

function RouteComponent() {
  const grading = Route.useLoaderData();
  sessionStorage.setItem("gradingId", grading.id);
  const gradingStep = sessionStorage.getItem("gradingStep") || undefined;

  return (
    <UploadAssignmentPage initialGradingAttempt={grading} initialStep={gradingStep} />
  );
}
