import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { GradingService } from "@/services/grading-service";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/gradings/create")({
  preload: false,
  component: () => null,
  validateSearch: z.object({
    rubricId: z.string().optional(),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { auth, queryClient }, deps: { rubricId } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const grading = await GradingService.createGradingAttempt(rubricId, token);
    queryClient.invalidateQueries({
      queryKey: ["gradingAttempts"],
    });

    throw redirect({
      to: "/gradings/$gradingId",
      params: { gradingId: grading.id },
      replace: true,
    });
  },
  pendingComponent: () => <PendingComponent message="Creating grading session..." />,
  errorComponent: () => <ErrorComponent message="Failed to create grading session" />,
});
