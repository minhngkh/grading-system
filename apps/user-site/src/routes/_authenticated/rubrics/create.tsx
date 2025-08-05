import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { RubricService } from "@/services/rubric-service";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rubrics/create")({
  preload: false,
  component: () => null,
  loader: async ({ context: { auth, queryClient } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const rubric = await RubricService.createRubric(token);
    console.log("Created rubric:", rubric.id);
    queryClient.invalidateQueries({
      queryKey: ["rubrics"],
    });

    throw redirect({
      to: "/rubrics/$id",
      params: { id: rubric.id },
      replace: true,
    });
  },
  errorComponent: () => <ErrorComponent message="Failed to create rubric" />,
  pendingComponent: () => <PendingComponent message="Initializing rubric..." />,
});
