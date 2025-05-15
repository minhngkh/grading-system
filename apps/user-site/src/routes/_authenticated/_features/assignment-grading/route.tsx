import { createGradingAttempt } from "@/services/gradingServices";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const GradingRoute = createFileRoute(
  "/_authenticated/_features/assignment-grading",
)({
  loader: async () => {
    try {
      const newGradingId = await createGradingAttempt();
      return redirect({ to: "/assignment-grading", params: { gradingId: newGradingId } });
    } catch (err) {
      console.error(err);
    }
  },
  component: () => null,
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent(),
  onLeave: () => {
    sessionStorage.removeItem("gradingStep");
  },
});

function PendingComponent() {
  return (
    <div className="container flex size-full justify-center items-center">
      Creating rubric...
    </div>
  );
}

function ErrorComponent() {
  return (
    <div className="container flex size-full justify-center items-center">
      Service not available. Please try again later!
    </div>
  );
}
