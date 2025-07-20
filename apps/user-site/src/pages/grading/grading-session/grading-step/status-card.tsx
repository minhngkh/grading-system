import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AssessmentState } from "@/types/assessment";
import { AssessmentGradingStatus } from "@/types/grading-progress";
import { Link } from "@tanstack/react-router";
import {
  Check,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCw,
  FileSearch,
} from "lucide-react";
import { memo } from "react";

type AssessmentStyle = {
  color: string;
  label: string;
  icon: React.ReactNode;
};

const assessmentStateStyles: Partial<Record<AssessmentState, AssessmentStyle>> = {
  [AssessmentState.Created]: {
    color: "text-blue-600 dark:text-blue-400",
    label: "Processing files",
    icon: <FileText className="size-4 text-blue-600 dark:text-blue-400" />,
  },
  [AssessmentState.AutoGradingStarted]: {
    color: "text-amber-600 dark:text-amber-400",
    label: "Grading in progress",
    icon: <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400" />,
  },
  [AssessmentState.AutoGradingFinished]: {
    color: "text-green-600 dark:text-green-400",
    label: "Grading completed",
    icon: <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />,
  },
  [AssessmentState.Completed]: {
    color: "text-green-600 dark:text-green-400",
    label: "Grading completed",
    icon: <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />,
  },
  [AssessmentState.AutoGradingFailed]: {
    color: "text-red-600 dark:text-red-400",
    label: "Grading failed",
    icon: <XCircle className="size-4 text-red-600 dark:text-red-400" />,
  },
};

interface AssessmentStatusCardProps {
  status: AssessmentGradingStatus;
  gradingId: string;
  onRegrade?: (id: string) => void;
}

function getCurrentStatuses(current: AssessmentState): AssessmentState[] {
  const states: AssessmentState[] = [AssessmentState.Created];

  if (
    current !== AssessmentState.AutoGradingStarted &&
    current !== AssessmentState.Created
  ) {
    states.push(AssessmentState.AutoGradingStarted);
  }

  states.push(current);

  return states;
}

export const AssessmentStatusCard = memo(
  ({ status, onRegrade, gradingId }: AssessmentStatusCardProps) => {
    const currentStatuses = getCurrentStatuses(status.status);
    const isUndergoingGrading =
      status.status === AssessmentState.AutoGradingStarted ||
      status.status === AssessmentState.Created;

    return (
      <Card
        className={cn(
          "gap-0 bg-background",
          status.status === AssessmentState.AutoGradingFailed &&
            "border-red-200 dark:border-red-800",
          status.status === AssessmentState.AutoGradingFinished ||
            (status.status === AssessmentState.Completed &&
              "border-green-200 dark:border-green-800"),
          isUndergoingGrading && "border-blue-200 dark:border-blue-800",
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {status.submissionReference}
            </CardTitle>
            {!isUndergoingGrading && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => onRegrade?.(status.assessmentId)}
                  size="sm"
                >
                  <RotateCw className="size-4" />
                  Rerun
                </Button>
                <Link
                  to="/gradings/$gradingId/assessments/$assessmentId"
                  params={{ gradingId: gradingId, assessmentId: status.assessmentId }}
                >
                  <Button size="sm" className="flex items-center gap-2 w-full">
                    <FileSearch className="h-4 w-4" />
                    Review
                  </Button>
                </Link>
              </div>
            )}
          </div>
          {status.errorMessage && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950/30 dark:border-red-800">
              <p className="text-sm text-red-700 font-medium dark:text-red-300">
                Error: {status.errorMessage}
              </p>
              <p className="text-xs text-red-600 mt-1 dark:text-red-400">
                Please try regrading this assessment.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            {currentStatuses.map((statusItem, index) => {
              const { color, icon, label } = assessmentStateStyles[statusItem] || {
                color: "text-gray-500 dark:text-gray-400",
                label: "Unknown State",
                icon: <Check className="size-4 text-gray-500 dark:text-gray-400" />,
                badgeVariant: "outline" as const,
              };

              const isCurrent = index === currentStatuses.length - 1;
              const isCompleted =
                index < currentStatuses.length - 1 ||
                (isCurrent &&
                  (status.status === AssessmentState.AutoGradingFinished ||
                    status.status === AssessmentState.AutoGradingFailed ||
                    status.status === AssessmentState.Completed));

              const isFailed =
                status.status === AssessmentState.AutoGradingFailed &&
                (statusItem === AssessmentState.AutoGradingFailed ||
                  index < currentStatuses.length - 1);

              return (
                <div className="flex items-center gap-3 py-2 rounded-md" key={index}>
                  {isCurrent && isUndergoingGrading ?
                    <Loader2 className={cn("size-4 animate-spin", color)} />
                  : icon}
                  <span className={cn("text-sm font-medium", color)}>{label}</span>
                  {isCompleted &&
                    (isFailed ?
                      <XCircle className="size-3 text-red-500 ml-auto dark:text-red-400" />
                    : <Check className="size-3 text-green-500 ml-auto dark:text-green-400" />)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  },
);

AssessmentStatusCard.displayName = "AssessmentStatusCard";
