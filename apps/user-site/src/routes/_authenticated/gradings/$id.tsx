import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import GradingResult from "@/pages/review/grading-result";
import { GradingService } from "@/services/grading-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/$id")({
  component: RouteComponent,
  loader: async ({ params: { id } }) => {
    return await GradingService.getGradingAttempt(id);
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading grading result..."),
});

function RouteComponent() {
  const gradingAttempt = Route.useLoaderData();
  return <GradingResult gradingAttempt={gradingAttempt} />;
}
