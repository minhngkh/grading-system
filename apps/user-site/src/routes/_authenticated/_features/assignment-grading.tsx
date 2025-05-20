import ErrorComponent from "@/components/route-error";
import PendingComponent from "@/components/route-pending";
import UploadAssignmentPage from "@/pages/features/assignment-grading";
import { createGradingAttempt, getGradingAttempt } from "@/services/gradingServices";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_features/assignment-grading")({
  component: RouteComponent,
  beforeLoad: async () => {
    const gradingStep = sessionStorage.getItem("gradingStep") ?? undefined;

    let gradingId = sessionStorage.getItem("gradingId") ?? undefined;
    if (!gradingId) {
      gradingId = await createGradingAttempt();
      sessionStorage.setItem("gradingId", gradingId);
    }

    return { gradingId, gradingStep };
  },
  loader: async ({ context: { gradingId, gradingStep } }) => {
    // Fetch the grading attempt details using the attemptId
    const attempt = await getGradingAttempt(gradingId);
    return { gradingStep, attempt };
  },
  onLeave: () => {
    sessionStorage.removeItem("gradingStep");
    sessionStorage.removeItem("gradingId");
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading grading..."),
});

function RouteComponent() {
  const { gradingStep, attempt } = Route.useLoaderData();
  return (
    <UploadAssignmentPage initalStep={gradingStep} initialGradingAttempt={attempt} />
  );
}
