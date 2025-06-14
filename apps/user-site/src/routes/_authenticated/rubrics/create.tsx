import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import RubricGenerationPage from "@/pages/rubric/rubric-generation";
import { RubricService } from "@/services/rubric-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rubrics/create")({
  preload: false,
  component: RouteComponent,
  beforeLoad: () => {
    const id = sessionStorage.getItem("rubricId");
    return { id };
  },
  loader: async ({ context: { auth, id } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    if (id) {
      return await RubricService.getRubric(id, token);
    }

    return await RubricService.createRubric(token);
  },
  onLeave: () => {
    sessionStorage.removeItem("rubricStep");
    sessionStorage.removeItem("rubricId");
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Creating rubric..."),
});

function RouteComponent() {
  const rubric = Route.useLoaderData();
  sessionStorage.setItem("rubricId", rubric.id);
  const rubricStep = sessionStorage.getItem("rubricStep") || undefined;
  return <RubricGenerationPage initialRubric={rubric} rubricStep={rubricStep} />;
}
