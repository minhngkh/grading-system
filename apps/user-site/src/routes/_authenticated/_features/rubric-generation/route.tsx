import { createRubric } from "@/services/rubricService";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const RubricRoute = createFileRoute("/_authenticated/_features/rubric-generation")(
  {
    loader: async () => {
      try {
        const newRubricId = await createRubric();
        return redirect({ to: "/rubric-generation", params: { rubricId: newRubricId } });
      } catch (err) {
        console.error(err);
      }
    },
    component: () => null,
    errorComponent: () => ErrorComponent(),
    pendingComponent: () => PendingComponent(),
  },
);

function PendingComponent() {
  return (
    <div className="container flex size-full justify-center items-center">
      Creating rubric...
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
