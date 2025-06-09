import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import GradingResult from "@/pages/review/grading-result";
import { GradingService } from "@/services/grading-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/$gradingId/result")({
  component: RouteComponent,
  loader: async ({ params: { gradingId }, context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    return await GradingService.getGradingAttempt(gradingId, token);
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading grading result..."),
});

function RouteComponent() {
  const gradingAttempt = Route.useLoaderData();
  return <GradingResult gradingAttempt={gradingAttempt} />;
}
