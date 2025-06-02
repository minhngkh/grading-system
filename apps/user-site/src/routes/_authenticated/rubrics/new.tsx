import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import RubricGenerationPage from "@/pages/rubric/rubric-generation";
import { RubricService } from "@/services/rubric-service";
import { Rubric } from "@/types/rubric";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rubrics/new")({
  preload: false,
  component: RoutePage,
  beforeLoad: async () => {
    let rubricId = sessionStorage.getItem("rubricId");
    return { rubricId };
  },
  loader: ({ context: { rubricId } }) => {
    if (!rubricId) {
      return RubricService.createRubric();
    }

    return RubricService.getRubric(rubricId);
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

  // If rubricId is not present, create a new rubric and store it in sessionStorage
  if (!rubricId) {
    const newRubricId = Route.useLoaderData() as string;
    sessionStorage.setItem("rubricId", newRubricId);

    const newRubric = {
      id: newRubricId,
      rubricName: "New Rubric",
      tags: [],
      criteria: [],
    };

    return <RubricGenerationPage rubricStep={rubricStep} initialRubric={newRubric} />;
  }

  // If rubricId is present, fetch the rubric and pass it to the RubricGenerationPage
  const rubric = Route.useLoaderData() as Rubric;
  return <RubricGenerationPage rubricStep={rubricStep} initialRubric={rubric} />;
}
