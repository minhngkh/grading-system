import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import RubricGenerationPage from "@/pages/rubric/rubric-generation";
import { RubricService } from "@/services/rubric-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rubrics/create")({
  preload: false,
  component: RoutePage,
  beforeLoad: async () => {
    let rubricId = sessionStorage.getItem("rubricId");
    return { rubricId };
  },
  loader: async ({ context: { rubricId } }) => {
    if (!rubricId) {
      return await RubricService.createRubric();
    }

    return await RubricService.getRubric(rubricId);
  },
  onLeave: () => {
    sessionStorage.removeItem("rubricId");
    sessionStorage.removeItem("rubricStep");
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading rubric..."),
});

function RoutePage() {
  const { rubricId } = Route.useRouteContext();
  const rubricStep = sessionStorage.getItem("rubricStep") ?? undefined;
  const rubric = Route.useLoaderData();

  if (!rubricId) {
    sessionStorage.setItem("rubricId", rubric.id);
  }

  return <RubricGenerationPage rubricStep={rubricStep} initialRubric={rubric} />;
}
