import ErrorComponent from "@/components/routeError";
import PendingComponent from "@/components/routePending";
import UploadAssignmentPage from "@/pages/features/assignment-grading";
import { createGradingAttempt, getGradingAttempt } from "@/services/gradingServices";
import { GradingAttempt } from "@/types/grading";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_features/assignment-grading")({
  component: RouteComponent,
  beforeLoad: async () => {
    const gradingStep = sessionStorage.getItem("gradingStep") ?? undefined;

    let gradingId = sessionStorage.getItem("gradingId") ?? undefined;
    if (!gradingId) {
      gradingId = "123"; // Placeholder for the grading attempt ID
      // gradingId = await createGradingAttempt();
      sessionStorage.setItem("gradingId", gradingId);
    }

    return { gradingId, gradingStep };
  },
  loader: async ({ context: { gradingId, gradingStep } }) => {
    // Fetch the grading attempt details using the attemptId
    // const attempt = await getGradingAttempt(gradingId);
    const attempt: GradingAttempt = {
      id: gradingId,
      selectors: [],
    };
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
