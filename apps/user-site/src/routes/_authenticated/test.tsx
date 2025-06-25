import { AssessmentStatusCard } from "@/pages/grading/grading-session/grading-step/status-card";
import { AssessmentState } from "@/types/assessment";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/test")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AssessmentStatusCard
      status={{
        id: "123",
        submissionReference: "Test Assessment",
        errorMessage: undefined,
        status: AssessmentState.AutoGradingStarted,
      }}
    />
  );
}
