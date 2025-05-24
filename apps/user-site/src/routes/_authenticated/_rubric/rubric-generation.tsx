import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import RubricGenerationPage from "@/pages/rubric/rubric-generation";
import { createRubric, getRubric } from "@/services/rubric-service";
import { Rubric } from "@/types/rubric";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_rubric/rubric-generation")({
  preload: false,
  component: RoutePage,
  beforeLoad: async () => {
    let rubricId = sessionStorage.getItem("rubricId") ?? undefined;
    if (!rubricId) {
      rubricId = crypto.randomUUID();
      // rubricId = await createRubric();
      sessionStorage.setItem("rubricId", rubricId);
    }

    return { rubricId };
  },
  loader: async ({ context: { rubricId } }) => {
    const rubric: Rubric = {
      id: rubricId,
      rubricName: "New Rubric",
      tags: [],
      criteria: [],
    };
    return rubric;
  },
  onLeave: () => sessionStorage.removeItem("rubricId"),
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading rubric..."),
});

function RoutePage() {
  const rubric = Route.useLoaderData();
  return <RubricGenerationPage initialRubric={rubric} />;
}
