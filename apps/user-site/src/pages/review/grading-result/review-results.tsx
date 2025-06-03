import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, FileSearch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Assessment } from "@/types/assessment";
import { createCriteriaColorMap, getCriteriaColorStyle } from "./colors";
import { Link, useNavigate } from "@tanstack/react-router";

const ResultCardSkeleton = () => (
  <Card className="overflow-hidden py-0">
    <div className="flex flex-col md:flex-row">
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex md:flex-col justify-end p-4 bg-muted gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  </Card>
);

interface ReviewResultsProps {
  isLoading: boolean;
  assessments: Assessment[];
  scaleFactor: number;
}

export default function ReviewResults({
  isLoading,
  assessments,
  scaleFactor,
}: ReviewResultsProps) {
  // Create color map from all unique criteria names
  const allCriteriaNames =
    assessments[0]?.scoreBreakdowns.map((breakdown) => breakdown.criterionName) || [];
  const criteriaColorMap = createCriteriaColorMap(allCriteriaNames);
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Grading Results</h2>
      {isLoading ?
        <ResultCardSkeleton />
      : <div className="space-y-4">
          {assessments.map((item) => (
            <Card key={item.id} className="overflow-hidden py-0">
              <div className="flex flex-col md:flex-row">
                <Link
                  to="/assessments/$id"
                  params={{ id: item.id }}
                  className="flex-1 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {item.submissionReference}
                    </h3>
                    <span className="text-2xl font-bold">
                      {(item.rawScore * scaleFactor) / 100} ({item.rawScore}%)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {item.scoreBreakdowns.map((score, index) => {
                      const colorStyle = getCriteriaColorStyle(
                        score.criterionName,
                        criteriaColorMap,
                      );

                      const finalScore = ((score.rawScore * scaleFactor) / 100).toFixed(
                        2,
                      );

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className={colorStyle.text}>{score.criterionName}</span>
                            <span className={colorStyle.text}>
                              {finalScore} ({score.rawScore}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colorStyle.bg}`}
                              style={{ width: `${score.rawScore}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Link>

                <div className="flex md:flex-col justify-end p-4 bg-muted">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 mb-2 w-full"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Rerun
                  </Button>
                  <Button className="flex items-center gap-2 w-full">
                    <FileSearch
                      className="h-4 w-4"
                      onClick={() =>
                        navigate({ to: "/assessments/$id", params: { id: item.id } })
                      }
                    />
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }
    </section>
  );
}
