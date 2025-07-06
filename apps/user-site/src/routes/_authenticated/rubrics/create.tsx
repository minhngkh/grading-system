import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { createRubricMutationOptions } from "@/queries/rubric-queries";
import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/_authenticated/rubrics/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const auth = useAuth();
  const didRun = useRef(false);

  const { mutate, isPending, isError } = useMutation(
    createRubricMutationOptions(auth, {
      onSuccess: (rubric) => {
        sessionStorage.removeItem("rubricStep");
        navigate({
          to: "/rubrics/$id",
          params: { id: rubric.id },
          replace: true,
        });
      },
      onError: (error) => {
        console.error("Error creating rubric:", error);
      },
    }),
  );

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    mutate();
  }, [mutate, navigate]);

  if (isPending) {
    return <PendingComponent message="Creating rubric..." />;
  }

  if (isError) {
    return <ErrorComponent message="Failed to create rubric" />;
  }

  return null;
}
