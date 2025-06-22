import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, FileSearch } from "lucide-react";
import { Assessment, AssessmentState } from "@/types/assessment";
import { getCriteriaColorStyle } from "./colors";
import { Link } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { AssessmentService } from "@/services/assessment-service";
import { ResultCardSkeleton } from "@/pages/grading/grading-result/skeletons";

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

  const handleRerun = async () => {
    const token = await auth.getToken();
    if (!token) {
      toast.error("You are not authorized to perform this action.");
      return;
    }

    try {
      await AssessmentService.rerunAssessment(item.id, token);
    } catch (error) {
      console.error("Failed to rerun assessment:", error);
      toast.error(
        `Failed to rerun assessment: ${item.submissionReference}. Please try again.`,
      );
    }
  };

  const isUnderGrading = item.status === AssessmentState.AutoGradingStarted;

  if (isUnderGrading) {
    return <ResultCardSkeleton />;
  }

  return (
    <Card className="overflow-hidden py-0">
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {item.submissionReference}
            </h3>
            <span className="text-2xl font-bold">
              {(item.rawScore * scaleFactor) / 100} point(s)
            </span>
          </div>

          <div className="space-y-3">
            {item.scoreBreakdowns.map((score, index) => {
              const colorStyle = getCriteriaColorStyle(
                score.criterionName,
                criteriaColorMap,
              );

              const finalScore = ((score.rawScore * scaleFactor) / 100).toFixed(2);

              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={colorStyle.text}>{score.criterionName}</span>
                    <span className={colorStyle.text}>
                      {finalScore} ({score.rawScore}%)
                    </span>
                  </div>
                  {index !== item.scoreBreakdowns.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex md:flex-col justify-end p-4 bg-muted">
          <Button
            onClick={handleRerun}
            variant="outline"
            className="flex items-center gap-2 mb-2 w-full"
            disabled={isUnderGrading}
          >
            <RefreshCw className="h-4 w-4" />
            Rerun
          </Button>
          <Link
            disabled={isUnderGrading}
            to="/gradings/$gradingId/assessments/$assessmentId"
            params={{ gradingId: item.gradingId, assessmentId: item.id }}
          >
            <Button className="flex items-center gap-2 w-full">
              <FileSearch className="h-4 w-4" />
              Review
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
