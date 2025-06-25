import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { GradingService } from "@/services/grading-service";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/create")({
  component: () => null,
  loader: async ({ context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("You must be logged in to create a grading session.");
    }

    const grading = await GradingService.createGradingAttempt(token);
    throw redirect({
      to: "/gradings/$gradingId",
      params: { gradingId: grading.id },
      replace: true,
    });
  },
  errorComponent: () => <ErrorComponent message="Failed to create grading session" />,
  pendingComponent: () => <PendingComponent message="Initializing grading session..." />,
});
