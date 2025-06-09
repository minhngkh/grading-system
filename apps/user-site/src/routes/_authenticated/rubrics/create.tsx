import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { RubricService } from "@/services/rubric-service";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rubrics/create")({
  preload: false,
  component: () => null, // No component to render, just redirect
  loader: async ({ context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const rubric = await RubricService.createRubric(token);
    return redirect({
      to: "/rubrics/$id",
      params: { id: rubric.id },
    });
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Creating rubric..."),
});
