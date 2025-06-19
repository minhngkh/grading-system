import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import UploadAssignmentPage from "@/pages/grading/grading-session";
import { GradingService } from "@/services/grading-service";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import z from "zod";

const searchSchema = z.object({
  id: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/gradings/create")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("You must be logged in to create a grading session.");
    }

    if (deps.id) {
      return await GradingService.getGradingAttempt(deps.id, token);
    }

    return await GradingService.createGradingAttempt(token);
  },
  onLeave: () => {
    sessionStorage.removeItem("gradingStep");
  },
  errorComponent: () => ErrorComponent("Failed to initialize grading session."),
  pendingComponent: () => PendingComponent("Initializing grading session..."),
});

function RouteComponent() {
  const grading = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const setIdParam = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        id: grading.id,
      }),
      replace: true,
    });
  };

  useEffect(() => {
    if (!search.id && grading?.id) {
      setIdParam();
    }
  }, [search.id, grading?.id, navigate]);

  const gradingStep = sessionStorage.getItem("gradingStep") || undefined;

  return (
    <UploadAssignmentPage initialGradingAttempt={grading} initialStep={gradingStep} />
  );
}
