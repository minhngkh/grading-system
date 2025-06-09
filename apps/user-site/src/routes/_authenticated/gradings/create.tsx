import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { GradingService } from "@/services/grading-service";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/create")({
  component: () => null,
  loader: async ({ context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const gradingAttempt = await GradingService.createGradingAttempt(token);
    throw redirect({
      to: "/gradings/$gradingId",
      params: { gradingId: gradingAttempt.id },
    });
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Initializing grading..."),
});
