import { GradingAttempt, GradingStatus } from "@/types/grading";
import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import { SignalRService } from "@/services/realtime-service";
import { Spinner } from "@/components/app/spinner";
import { useAuth } from "@clerk/clerk-react";
import { AssessmentGradingStatus } from "@/types/grading-progress";
import { UseFormReturn } from "react-hook-form";
import { AssessmentStatusCard } from "@/pages/grading/grading-session/grading-step/status-card";
import { AssessmentState } from "@/types/assessment";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rerunAssessmentMutationOptions } from "@/queries/assessment-queries";
import { startGradingMutationOptions } from "@/queries/grading-queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";

// Memoized loading component to prevent unnecessary re-renders
const LoadingState = memo(() => (
  <div className="size-full text-semibold">
    <div className="flex flex-col items-center justify-center h-full">
      <Spinner />
      <span>Starting grading</span>
    </div>
  </div>
));
LoadingState.displayName = "LoadingState";

// Memoized empty state component
const EmptyState = memo(() => (
  <div className="size-full text-semibold">
    <div className="flex items-center justify-center h-full">
      <span className="text-destructive">
        No assessments found. Something went wrong.
      </span>
    </div>
  </div>
));
EmptyState.displayName = "EmptyState";

// Utility functions moved outside component for better performance
const getStatus = (status: GradingStatus) => {
  switch (status) {
    case GradingStatus.Started:
      return {
        text: "In Progress",
        variant: "secondary" as const,
        icon: <Clock className="size-4" />,
      };
    case GradingStatus.Graded:
      return {
        text: "Completed",
        variant: "default" as const,
        icon: <CheckCircle className="size-4" />,
      };
    case GradingStatus.Failed:
      return {
        text: "Failed",
        variant: "destructive" as const,
        icon: <XCircle className="size-4" />,
      };
    default:
      return {
        text: "Unknown",
        variant: "outline" as const,
        icon: <AlertCircle className="size-4" />,
      };
  }
};

const getHeaderStyling = (status: GradingStatus) => {
  switch (status) {
    case GradingStatus.Started:
      return {
        cardClass:
          "border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 dark:border-blue-700",
        badgeClass: "bg-blue-500 hover:bg-blue-600 text-white",
        progressClass: "[&>div]:bg-blue-500",
      };
    case GradingStatus.Graded:
      return {
        cardClass:
          "border-green-300 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 dark:border-green-700",
        badgeClass: "bg-green-500 hover:bg-green-600 text-white",
        progressClass: "[&>div]:bg-green-500",
      };
    case GradingStatus.Failed:
      return {
        cardClass:
          "border-red-300 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 dark:border-red-700",
        badgeClass: "bg-red-500 hover:bg-red-600 text-white",
        progressClass: "[&>div]:bg-red-500",
      };
    default:
      return {
        cardClass:
          "border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/50 dark:border-gray-700",
        badgeClass: "",
        progressClass: "",
      };
  }
};

// Virtualized Assessment List Component
interface VirtualizedAssessmentListProps {
  assessments: AssessmentGradingStatus[];
  gradingId: string;
  onRegrade: (assessmentId: string) => void;
}

const VirtualizedAssessmentList = memo(
  ({ assessments, gradingId, onRegrade }: VirtualizedAssessmentListProps) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
      count: assessments.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 210, // Card height + padding bottom (16px)
      overscan: 3, // Number of items to render outside visible area
      measureElement:
        typeof ResizeObserver !== "undefined" ?
          (element) => element?.getBoundingClientRect().height
        : undefined,
    });

    return (
      <div
        ref={parentRef}
        className="pl-1 pr-2 h-[70vh] max-h-[800px] min-h-[400px] custom-scrollbar overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="space-y-4">
                <AssessmentStatusCard
                  status={assessments[virtualItem.index]}
                  gradingId={gradingId}
                  onRegrade={onRegrade}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

VirtualizedAssessmentList.displayName = "VirtualizedAssessmentList";

interface GradingProgressStepProps {
  gradingAttempt: UseFormReturn<GradingAttempt>;
}

export default function GradingProgressStep({
  gradingAttempt,
}: GradingProgressStepProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const gradingAttemptValues = gradingAttempt.watch();
  const [assessmentStatus, setAssessmentStatus] = useState<
    AssessmentGradingStatus[] | null
  >(null);

  const queryClient = useQueryClient();

  const rerunMutation = useMutation(rerunAssessmentMutationOptions(auth));

  const startGradingMutation = useMutation(
    startGradingMutationOptions(gradingAttemptValues.id, auth, {
      onError: (error: any) => {
        handleGradingStatusChange(GradingStatus.Failed);
        console.error(`Failed while grading ${gradingAttemptValues.name}:`, error);
      },
    }),
  );

  const handleGradingStatusChange = useCallback(
    (newStatus: GradingStatus) => {
      gradingAttempt.setValue("status", newStatus);

      if (newStatus === GradingStatus.Started) {
        toast.info(
          `Grading ${gradingAttemptValues.name} has started. You can check back later for updates.`,
        );
      } else if (newStatus === GradingStatus.Failed) {
        toast.error(`Grading ${gradingAttemptValues.name} failed. Please try again.`);
      } else if (newStatus === GradingStatus.Graded) {
        toast.success(`Grading ${gradingAttemptValues.name} completed successfully.`);
      }

      queryClient.invalidateQueries({
        queryKey: ["gradingAttempt", gradingAttemptValues.id],
      });
    },
    [gradingAttempt, gradingAttemptValues.name, gradingAttemptValues.id, queryClient],
  );

  const handleStatusChange = useCallback((newStatus: AssessmentGradingStatus) => {
    setAssessmentStatus((prev) => {
      if (prev == null || prev.length === 0) return [newStatus];

      const exists = prev.some((item) => item.assessmentId === newStatus.assessmentId);
      if (!exists) {
        return [...prev, newStatus];
      }

      return prev.map((item) =>
        item.assessmentId === newStatus.assessmentId ? newStatus : item,
      );
    });
  }, []);

  const handleRegister = useCallback(
    (initialStatus: AssessmentGradingStatus[]) => {
      setAssessmentStatus(initialStatus);

      if (
        !initialStatus.some(
          (status) => status.status === AssessmentState.AutoGradingStarted,
        )
      ) {
        gradingAttempt.setValue("status", GradingStatus.Graded);
      }
    },
    [gradingAttempt],
  );

  const handleRegradeAssessment = useCallback(
    async (assessmentId: string) => {
      try {
        await rerunMutation.mutateAsync(assessmentId);
        handleGradingStatusChange(GradingStatus.Started);
        queryClient.invalidateQueries({
          queryKey: ["assessment", assessmentId],
        });
      } catch (error) {
        console.error("Failed to regrade assessment:", error);
        toast.error(`Failed to regrade assessment. Please try again.`);
      }
    },
    [rerunMutation, handleGradingStatusChange, queryClient],
  );

  const getProgressStats = useMemo(() => {
    if (!assessmentStatus)
      return { completedCount: 0, totalCount: 0, progressPercentage: 0 };

    const completedCount = assessmentStatus.filter(
      (assessment) =>
        assessment.status !== AssessmentState.AutoGradingStarted &&
        assessment.status !== AssessmentState.Created,
    ).length;
    const totalCount = assessmentStatus.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return { completedCount, totalCount, progressPercentage };
  }, [assessmentStatus]);

  const sortedAssessmentStatus = useMemo(() => {
    if (!assessmentStatus) return [];

    return [...assessmentStatus].sort((a, b) => {
      const aIsFailed = a.status === AssessmentState.AutoGradingFailed;
      const bIsFailed = b.status === AssessmentState.AutoGradingFailed;
      if (aIsFailed && !bIsFailed) return -1;
      if (!aIsFailed && bIsFailed) return 1;
      return 0;
    });
  }, [assessmentStatus]);

  const statusInfo = getStatus(gradingAttemptValues.status);
  const { completedCount, totalCount, progressPercentage } = getProgressStats;
  const headerStyling = getHeaderStyling(gradingAttemptValues.status);

  const hubRef = useRef<SignalRService | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const initGrading = async () => {
      if (hubRef.current || hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      const token = await auth.getToken();
      if (!token) return;

      try {
        const hub = new SignalRService(() => token);

        hub.on("ReceiveAssessmentProgress", handleStatusChange);
        hub.on("Complete", () => handleGradingStatusChange(GradingStatus.Graded));

        if (gradingAttemptValues.status === GradingStatus.Created) {
          await startGradingMutation.mutateAsync();
          handleGradingStatusChange(GradingStatus.Started);
        }

        await hub.start();
        hubRef.current = hub;

        const initialState = await hub.invoke("Register", gradingAttemptValues.id);
        handleRegister(initialState);
      } catch (error) {
        gradingAttempt.setValue("status", GradingStatus.Failed);
        console.error("Failed to start grading:", error);
        toast.error("Failed to start grading. Please try again.");
      }
    };

    initGrading();

    return () => {
      if (hubRef.current) {
        hubRef.current.off("Complete");
        hubRef.current.off("ReceiveAssessmentProgress");
        hubRef.current.stop();
        hubRef.current = null;
      }
    };
  }, []);

  if (gradingAttemptValues.status === GradingStatus.Failed) {
    return (
      <div className="size-full space-y-6">
        <Card className="border-2 gap-0 border-red-300 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 dark:border-red-700">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-red-700 dark:text-red-300">
                Grading Failed: {gradingAttemptValues.name}
              </CardTitle>
              <Badge className="bg-red-500 hover:bg-red-600 text-white border-red-600 text-sm px-4 py-2 font-semibold shadow-sm">
                <XCircle className="size-4" />
                Failed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="size-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  Failed to start grading
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  There was an error while attempting to start the grading process. Please
                  try again.
                </p>
              </div>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assessmentStatus === null) return <LoadingState />;

  if (assessmentStatus.length === 0) return <EmptyState />;

  return (
    <div className="size-full space-y-6">
      <Card
        className={cn(
          "border-2 gap-0 transition-all duration-300",
          headerStyling.cardClass,
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold">Grading Progress</CardTitle>
            <Badge
              variant={statusInfo.variant}
              className={cn("text-sm px-2", headerStyling.badgeClass)}
            >
              {statusInfo.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <span className="text-sm font-semibold">
                {completedCount}/{totalCount} assessments graded
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className={cn(
                "h-3 transition-all duration-300",
                headerStyling.progressClass,
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="font-medium">
                {Math.round(progressPercentage)}% complete
              </span>
              {gradingAttemptValues.status === GradingStatus.Started && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                  <Clock className="size-3" />
                  In progress...
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Status Cards */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Grading Details</h3>

        <VirtualizedAssessmentList
          assessments={sortedAssessmentStatus}
          gradingId={gradingAttemptValues.id}
          onRegrade={handleRegradeAssessment}
        />
      </div>

      {/* Action Section */}
      {gradingAttemptValues.status === GradingStatus.Started && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col w-full items-center gap-3">
              <div className="text-center space-y-1">
                <p className="font-medium">
                  You can continue with other tasks while grading is in progress
                </p>
                <p className="text-sm text-muted-foreground">
                  We'll notify you when the grading is complete
                </p>
              </div>
              <Button
                onClick={() =>
                  navigate({
                    to: "/home",
                  })
                }
                className="w-fit"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
