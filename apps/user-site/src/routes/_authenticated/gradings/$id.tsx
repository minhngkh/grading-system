import GradingResult from "@/pages/review/grading-result";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/$id")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { id } = params;
    const gradingAttempt = {
      id: id,
      selectors: [],
    };

    return { gradingAttempt };
  },
});

function RouteComponent() {
  const { gradingAttempt } = Route.useLoaderData();
  return <GradingResult gradingAttempt={gradingAttempt} />;
}
