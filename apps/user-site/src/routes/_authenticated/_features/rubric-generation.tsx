import RubricGenerationPage from "@/pages/features/rubric-generation";
import { createRubric, getRubric } from "@/services/rubricService";
import { createFileRoute } from "@tanstack/react-router";

const itemIdentifier = "rubric-gen";

export const Route = createFileRoute("/_authenticated/_features/rubric-generation")({
  component: RoutePage,
  preload: false,
  loader: async () => {
    try {
      let curRubricId = sessionStorage.getItem(itemIdentifier);
      if (!curRubricId) {
        curRubricId = await createRubric();
        sessionStorage.setItem(itemIdentifier, curRubricId);
      }

      return await getRubric(curRubricId);
    } catch (err) {
      console.log(err);
    }
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent(),
});

function PendingComponent() {
  return (
    <div className="container flex size-full justify-center items-center">
      Setting up...
    </div>
  );
}

function ErrorComponent() {
  return (
    <div className="container flex size-full justify-center items-center">
      Service not available. Please try again later!
    </div>
  );
}

function RoutePage() {
  const rubric = Route.useLoaderData();

  if (rubric) return <RubricGenerationPage initialRubric={rubric} />;

  return <div>Service not available!</div>;
}
