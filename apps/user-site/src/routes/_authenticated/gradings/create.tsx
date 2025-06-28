import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { createGradingAttemptMutationOptions } from "@/queries/grading-queries";
import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/_authenticated/gradings/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const auth = useAuth();
  const didRun = useRef(false);

  const { mutateAsync, isPending, isError } = useMutation(
    createGradingAttemptMutationOptions(auth),
  );

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const createGradingAttempt = async () => {
      try {
        const grading = await mutateAsync();
        sessionStorage.removeItem("gradingStep");

        navigate({
          to: "/gradings/$gradingId",
          params: { gradingId: grading.id },
          replace: true,
        });
      } catch (error) {
        console.error("Error creating grading attempt:", error);
      }
    };

    createGradingAttempt();
  }, [mutateAsync, navigate]);

  if (isPending) {
    return <PendingComponent message="Creating grading session..." />;
  }

  if (isError) {
    return <ErrorComponent message="Failed to create grading session" />;
  }

  return null;
}
