import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { Button } from "@/components/ui/button";
import GradingResult from "@/pages/grading/grading-result";
import { GradingService } from "@/services/grading-service";
import { GradingStatus } from "@/types/grading";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gradings/$gradingId/result")({
  component: RouteComponent,
  loader: async ({ params: { gradingId }, context: { auth } }) => {
    const token = await auth.getToken();
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    return await GradingService.getGradingAttempt(gradingId, token);
  },
  errorComponent: () => (
    <ErrorComponent message="Failed to load grading result. Please try again later." />
  ),
  pendingComponent: () => <PendingComponent message="Loading grading result..." />,
});

function RouteComponent() {
  const gradingAttempt = Route.useLoaderData();

  const router = useRouter();
  if (
    gradingAttempt.status === GradingStatus.Created ||
    gradingAttempt.status === GradingStatus.Started
  )
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-lg font-semibold">
          The grading session is under grading or have not started yet.
        </p>
        <Button variant="destructive" onClick={() => router.history.back()}>
          Return
        </Button>
      </div>
    );

  return <GradingResult gradingAttempt={gradingAttempt} />;
}
