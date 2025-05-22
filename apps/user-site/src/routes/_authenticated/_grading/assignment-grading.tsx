import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import UploadAssignmentPage from "@/pages/grading/grading-session.tsx";
import { createGradingAttempt, getGradingAttempt } from "@/services/grading-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_grading/assignment-grading")({
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
