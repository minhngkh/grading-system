import RubricGenerationPage from "@/pages/features/rubric-generation";
import { getRubric } from "@/services/rubricService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/_features/rubric-generation/$rubricId",
)({
  component: RoutePage,
  preload: false,
  loader: async ({ params }) => {
    const { rubricId } = params;

    try {
      return await getRubric(rubricId);
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
      Loading rubric...
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
