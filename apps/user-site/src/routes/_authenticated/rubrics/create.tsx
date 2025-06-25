import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { RubricService } from "@/services/rubric-service";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rubrics/create")({
  preload: false,
  component: () => null,
  loader: async ({ context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const rubric = await RubricService.createRubric(token);
    throw redirect({
      to: "/rubrics/$id",
      params: { id: rubric.id },
      replace: true,
    });
  },
  errorComponent: () => <ErrorComponent message="Failed to create rubric" />,
  pendingComponent: () => <PendingComponent message="Creating rubric..." />,
});
