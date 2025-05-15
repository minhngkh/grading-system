import UploadAssignmentPage from "@/pages/features/assignment-grading";
import { getGradingAttempt } from "@/services/gradingServices";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/_features/assignment-grading/$gradingId",
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { gradingId } = params;
    const gradingStep = sessionStorage.getItem("gradingStep") ?? undefined;

    try {
      // Fetch the grading attempt details using the attemptId
      const attempt = await getGradingAttempt(gradingId);
      return { gradingStep, attempt };
    } catch (error) {
      console.error("Error fetching grading attempt:", error);
    }
  },
  onLeave: () => {
    sessionStorage.removeItem("gradingStep");
  },
  errorComponent: () => {
    return <div>Error loading the grading page.</div>;
  },
  pendingComponent: () => {
    return <div>Loading...</div>;
  },
});

function RouteComponent() {
  const data = Route.useLoaderData();
  if (!data) return <div>Error loading the grading page.</div>;

  return (
    <UploadAssignmentPage
      initalStep={data.gradingStep}
      initialGradingAttempt={data.attempt}
    />
  );
}
