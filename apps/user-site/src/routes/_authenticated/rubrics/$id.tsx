import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import RubricGenerationPage from "@/pages/rubric/rubric-generation";
import { getRubricQueryOptions } from "@/queries/rubric-queries";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/_authenticated/rubrics/$id")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  onLeave: () => {
    sessionStorage.removeItem("rubricStep");
  },
  errorComponent: () => <ErrorComponent message="Failed to load rubric" />,
  pendingComponent: () => <PendingComponent message="Loading rubric..." />,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const { data: rubric, isPending, error } = useQuery(getRubricQueryOptions(id, auth));

  if (isPending) {
    return <PendingComponent message="Loading rubric..." />;
  }

  if (error) {
    return <ErrorComponent message="Failed to load rubric. Please try again later." />;
  }

  if (!rubric) {
    return <ErrorComponent message="Rubric not found." />;
  }

  const rubricStep = sessionStorage.getItem("rubricStep") || undefined;
  return <RubricGenerationPage rubricStep={rubricStep} initialRubric={rubric} />;
}
