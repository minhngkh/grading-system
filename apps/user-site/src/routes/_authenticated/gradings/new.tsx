import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import UploadAssignmentPage from "@/pages/grading/grading-session";
import { GradingService } from "@/services/grading-service";
import { GradingAttempt } from "@/types/grading";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/new")({
  component: RouteComponent,
  beforeLoad: async () => {
    let gradingId = sessionStorage.getItem("gradingId") ?? undefined;
    return { gradingId };
  },
  loader: ({ context: { gradingId } }) => {
    if (!gradingId) {
      return GradingService.createGradingAttempt();
    }

    return GradingService.getGradingAttempt(gradingId);
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

  // If gradingId is not present, create a new grading attempt and store it in sessionStorage
  if (!gradingId) {
    const newGradingId = Route.useLoaderData() as string;
    sessionStorage.setItem("gradingId", newGradingId);

    const newGradingAttempt: GradingAttempt = {
      id: newGradingId,
      selectors: [],
    };

    return (
      <UploadAssignmentPage
        initialStep={gradingStep}
        initialGradingAttempt={newGradingAttempt}
      />
    );
  }

  // If gradingId is present, fetch the grading attempt and pass it to the UploadAssignmentPage
  const attempt = Route.useLoaderData() as GradingAttempt;
  return (
    <UploadAssignmentPage initialStep={gradingStep} initialGradingAttempt={attempt} />
  );
}
