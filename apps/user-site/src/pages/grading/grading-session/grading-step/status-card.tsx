import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AssessmentState } from "@/types/assessment";
import { AssessmentGradingStatus } from "@/types/grading-progress";
import { Check, CircleAlert, Loader2 } from "lucide-react";

type AssessmentStyle = {
  color: string;
  label: string;
  icon: React.ReactNode;
};

const assessmentStateStyles: Partial<Record<AssessmentState, AssessmentStyle>> = {
  [AssessmentState.Created]: {
    color: "text-gray-500",
    label: "Processing files",
    icon: <Check className="size-4 text-gray-500" />,
  },
  [AssessmentState.AutoGradingStarted]: {
    color: "text-blue-500",
    label: "Grading files",
    icon: <Check className="size-4 text-blue-500" />,
  },
  [AssessmentState.AutoGradingFinished]: {
    color: "text-green-500",
    label: "Grading Finished",
    icon: <Check className="size-4 text-green-500" />,
  },
  [AssessmentState.AutoGradingFailed]: {
    color: "text-destructive",
    label: "Grading Failed",
    icon: <CircleAlert className="size-4 text-destructive" />,
  },
};

interface AssessmentStatusCardProps {
  status: AssessmentGradingStatus;
}

export const AssessmentStatusCard = ({ status }: AssessmentStatusCardProps) => {
  function getCurrentStatuses(current: AssessmentState): AssessmentState[] {
    const states: AssessmentState[] = [AssessmentState.Created];

    if (current > AssessmentState.AutoGradingStarted) {
      states.push(AssessmentState.AutoGradingStarted);
    }

    states.push(current);

    return states;
  }

  const currentStatuses = getCurrentStatuses(status.status);

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-lg">{status.submissionReference}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {currentStatuses.map((status, index) => {
            const isSpinning =
              status <= AssessmentState.AutoGradingStarted &&
              index === currentStatuses.length - 1;
            const { color, icon, label } = assessmentStateStyles[status] || {
              color: "text-gray-500",
              label: "Unknown State",
              icon: <Check className="size-4 text-gray-500" />,
            };
            return (
              <div className="flex items-center gap-4" key={index}>
                {isSpinning ?
                  <Loader2 className={cn("size-4 animate-spin", color)} />
                : icon}
                <span className={cn(`text-sm font-medium`, color)}>{label}</span>
              </div>
            );
          })}
        </div>
        {status.errorMessage && (
          <p className="text-sm text-red-500">
            Error: {status.errorMessage}. Please try again!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
