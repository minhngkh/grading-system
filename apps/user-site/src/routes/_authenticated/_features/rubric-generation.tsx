import ErrorComponent from "@/components/routeError";
import PendingComponent from "@/components/routePending";
import RubricGenerationPage from "@/pages/features/rubric-generation";
import { createRubric, getRubric } from "@/services/rubricService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_features/rubric-generation")({
  preload: false,
  component: RoutePage,
  beforeLoad: async () => {
    let rubricId = sessionStorage.getItem("rubricId") ?? undefined;
    if (!rubricId) {
      rubricId = await createRubric();
      sessionStorage.setItem("rubricId", rubricId);
    }

    return { rubricId };
  },
  loader: async ({ context: { rubricId } }) => getRubric(rubricId),
  onLeave: () => {
    sessionStorage.removeItem("rubricId");
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading rubric..."),
});

function RoutePage() {
  const rubric = Route.useLoaderData();
  return <RubricGenerationPage initialRubric={rubric} />;
}
