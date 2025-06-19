import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import RubricGenerationPage from "@/pages/rubric/rubric-generation";
import { RubricService } from "@/services/rubric-service";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import z from "zod";

const searchSchema = z.object({
  id: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/rubrics/create")({
  preload: false,
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    if (deps.id) {
      return await RubricService.getRubric(deps.id, token);
    }

    return await RubricService.createRubric(token);
  },
  onLeave: () => {
    sessionStorage.removeItem("rubricStep");
  },
  errorComponent: () => ErrorComponent("Failed to create rubric."),
  pendingComponent: () => PendingComponent("Creating rubric..."),
});

function RouteComponent() {
  const rubric = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const setIdParam = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        id: rubric.id,
      }),
      replace: true,
    });
  };

  useEffect(() => {
    if (!search.id && rubric?.id) {
      setIdParam();
    }
  }, [search.id, rubric?.id, navigate]);

  const rubricStep = sessionStorage.getItem("rubricStep") || undefined;
  return <RubricGenerationPage initialRubric={rubric} rubricStep={rubricStep} />;
}
