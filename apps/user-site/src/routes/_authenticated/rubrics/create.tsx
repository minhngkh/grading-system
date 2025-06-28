import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { RubricService } from "@/services/rubric-service";
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

  const { mutateAsync, isPending, isError } = useMutation({
    mutationFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Unauthorized: No token");
      return RubricService.createRubric(token);
    },
  });

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const createRubric = async () => {
      try {
        const rubric = await mutateAsync();

        navigate({
          to: "/rubrics/$id",
          params: { id: rubric.id },
          replace: true,
        });
      } catch (err) {
        console.error("Failed to create rubric", err);
      }
    };

    createRubric();
  }, [mutateAsync, navigate]);

  if (isPending) {
    return <PendingComponent message="Creating rubric..." />;
  }

  if (isError) {
    return <ErrorComponent message="Failed to create rubric" />;
  }

  return null;
}
