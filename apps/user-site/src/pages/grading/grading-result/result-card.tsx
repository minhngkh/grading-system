import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, FileSearch } from "lucide-react";
import { Assessment, AssessmentState } from "@/types/assessment";
import { getCriteriaColorStyle } from "./colors";
import { Link } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { ResultCardSkeleton } from "@/pages/grading/grading-result/skeletons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rerunAssessmentMutationOptions } from "@/queries/assessment-queries";
import { useMemo } from "react";

interface AssessmentResultCardProps {
  item: Assessment;
  scaleFactor: number;
  criteriaColorMap: Record<string, { text: string; bg: string }>;
}

const getCardClassName = (state: AssessmentState) => {
  if (state === AssessmentState.AutoGradingFailed) {
    return "overflow-hidden py-0 border-red-200 dark:border-red-800";
  }

  if (state === AssessmentState.AutoGradingFinished) {
    return "overflow-hidden py-0 border-green-200 dark:border-green-800";
  }

  if (state === AssessmentState.AutoGradingStarted || state === AssessmentState.Created) {
    return "overflow-hidden py-0 border-blue-200 dark:border-blue-800";
  }

  if (state === AssessmentState.ManualGradingRequired) {
    return "overflow-hidden py-0 border-orange-200 dark:border-orange-800";
  }

  return "overflow-hidden py-0";
};
export function AssessmentResultCard({
  item,
  scaleFactor,
  criteriaColorMap,
}: AssessmentResultCardProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { isPending: isRerunning, mutate: rerunAssessment } = useMutation(
    rerunAssessmentMutationOptions(auth, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["gradingAttempts"],
        });

        queryClient.invalidateQueries({
          queryKey: ["assessment", item.id],
        });
      },
      onError: (error) => {
        console.error("Failed to rerun assessment:", error);
        toast.error(
          `Failed to rerun assessment: ${item.submissionReference}. Please try again.`,
        );
      },
    }),
  );

  const isGradingFailed = item.status === AssessmentState.AutoGradingFailed;

  const sortedScoreBreakdowns = useMemo(() => {
    return item.scoreBreakdowns.sort((a, b) => {
      return a.criterionName.localeCompare(b.criterionName);
    });
  }, [item.scoreBreakdowns]);

  if (item.status === AssessmentState.AutoGradingStarted) return <ResultCardSkeleton />;

  return (
    <Card className={getCardClassName(item.status)}>
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {item.submissionReference}
            </h3>
            {!isGradingFailed && (
              <span className="text-2xl font-bold">
                {((item.rawScore * scaleFactor) / 100).toFixed(2)} point(s)
              </span>
            )}
          </div>

          <div className="space-y-3">
            {sortedScoreBreakdowns.map((score, index) => {
              const colorStyle = getCriteriaColorStyle(
                score.criterionName,
                criteriaColorMap,
              );

              const finalScore = ((score.rawScore * scaleFactor) / 100).toFixed(2);

              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={colorStyle.text}>{score.criterionName}</span>
                    {score.grader === "None" || score.status === "Mannual" ?
                      <span className="text-orange-400">Require manual grading</span>
                    : <span className={colorStyle.text}>
                        {finalScore} ({score.rawScore}%)
                      </span>
                    }
                  </div>
                  {index !== item.scoreBreakdowns.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex md:flex-col justify-end p-4 bg-muted/40">
          <Button
            disabled={isRerunning}
            onClick={() => rerunAssessment(item.id)}
            variant="outline"
            className="flex items-center gap-2 mb-2 w-full"
          >
            <RefreshCw className="h-4 w-4" />
            Rerun
          </Button>
          <Link
            to="/gradings/$gradingId/assessments/$assessmentId"
            params={{ gradingId: item.gradingId, assessmentId: item.id }}
          >
            <Button className="flex items-center gap-2 w-full">
              <FileSearch className="h-4 w-4" />
              {isGradingFailed ? "Manual Grade" : "Review"}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
