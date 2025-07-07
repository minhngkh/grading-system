import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { createGradingAttemptMutationOptions } from "@/queries/grading-queries";
import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/gradings/create")({
  component: RouteComponent,
  validateSearch: z.object({
    rubricId: z.string().optional(),
  }),
});

function RouteComponent() {
  const { rubricId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const auth = useAuth();
  const didRun = useRef(false);

  const { mutate, isPending, isError } = useMutation(
    createGradingAttemptMutationOptions(auth, {
      onSuccess: (grading) => {
        sessionStorage.removeItem("gradingStep");
        navigate({
          to: "/gradings/$gradingId",
          params: { gradingId: grading.id },
          replace: true,
        });
      },
      onError: (error) => {
        console.error("Error creating grading attempt:", error);
      },
    }),
  );

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    mutate(rubricId);
  }, [mutate, navigate]);

  if (isPending) {
    return <PendingComponent message="Creating grading session..." />;
  }

  if (isError) {
    return <ErrorComponent message="Failed to create grading session" />;
  }

  return null;
}
