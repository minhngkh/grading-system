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
import { useMutation } from "@tanstack/react-query";
import { rerunAssessmentMutationOptions } from "@/queries/assessment-queries";
import { useMemo } from "react";

interface AssessmentResultCardProps {
  item: Assessment;
  scaleFactor: number;
  criteriaColorMap: Record<string, { text: string; bg: string }>;
}

export function AssessmentResultCard({
  item,
  scaleFactor,
  criteriaColorMap,
}: AssessmentResultCardProps) {
  const auth = useAuth();
  const {
    isPending: isRerunning,
    isError,
    mutateAsync: rerunAssessment,
  } = useMutation(rerunAssessmentMutationOptions(auth));

  const handleRerun = async () => {
    try {
      await rerunAssessment(item.id);
    } catch (error) {
      console.error("Failed to rerun assessment:", error);
      toast.error(
        `Failed to rerun assessment: ${item.submissionReference}. Please try again.`,
      );
    }
  };

  if (item.status === AssessmentState.AutoGradingStarted || isRerunning)
    return <ResultCardSkeleton />;

  const isGradingFailed = item.status === AssessmentState.AutoGradingFailed || isError;

  const sortedScoreBreakdowns = useMemo(() => {
    return item.scoreBreakdowns.sort((a, b) => {
      return a.criterionName.localeCompare(b.criterionName);
    });
  }, [item.scoreBreakdowns]);

  return (
    <Card className="overflow-hidden py-0">
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
            {isGradingFailed ?
              <div className="text-destructive text-sm">
                Grading for this submission has failed. Please regrade or manually grade
                this submission.
              </div>
            : sortedScoreBreakdowns.map((score, index) => {
                const colorStyle = getCriteriaColorStyle(
                  score.criterionName,
                  criteriaColorMap,
                );

                const finalScore = ((score.rawScore * scaleFactor) / 100).toFixed(2);

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className={colorStyle.text}>{score.criterionName}</span>
                      {score.grader === "None" ?
                        <span className="text-warning">Require manual grading</span>
                      : <span className={colorStyle.text}>
                          {finalScore} ({score.rawScore}%)
                        </span>
                      }
                    </div>
                    {index !== item.scoreBreakdowns.length - 1 && <Separator />}
                  </div>
                );
              })
            }
          </div>
        </div>

        <div className="flex md:flex-col justify-end p-4 bg-muted">
          <Button
            disabled={isRerunning}
            onClick={handleRerun}
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
