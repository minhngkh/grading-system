import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import RubricGenerationPage from "@/pages/rubric/rubric-generation";
import { RubricService } from "@/services/rubric-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_rubric/rubric-generation")({
  preload: false,
  component: RoutePage,
  beforeLoad: async () => {
    let rubricId = sessionStorage.getItem("rubricId") ?? undefined;
    if (!rubricId) {
      rubricId = await RubricService.createRubric();
      sessionStorage.setItem("rubricId", rubricId);
    }

    return { rubricId };
  },
  loader: async ({ context: { rubricId } }) => RubricService.getRubric(rubricId),
  onLeave: () => sessionStorage.removeItem("rubricId"),
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading rubric..."),
});

function RoutePage() {
  const rubric = Route.useLoaderData();
  return <RubricGenerationPage initialRubric={rubric} />;
}
