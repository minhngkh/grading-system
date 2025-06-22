import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import RubricGenerationPage from "@/pages/rubric/rubric-generation";
import { RubricService } from "@/services/rubric-service";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/rubrics/$id")({
  component: RouteComponent,
  validateSearch: ({ search }) => {
    const result = searchSchema.safeParse(search);
    return result.success ? result.data : {};
  },
  loader: async ({ params: { id }, context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    return await RubricService.getRubric(id, token);
  },
  onLeave: () => {
    sessionStorage.removeItem("rubricStep");
  },
  errorComponent: () => (
    <ErrorComponent message="Failed to load rubric. Please try again later." />
  ),
  pendingComponent: () => <PendingComponent message="Loading rubric..." />,
});

function RouteComponent() {
  const rubric = Route.useLoaderData();
  const rubricStep = sessionStorage.getItem("rubricStep") || undefined;

  return <RubricGenerationPage rubricStep={rubricStep} initialRubric={rubric} />;
}
