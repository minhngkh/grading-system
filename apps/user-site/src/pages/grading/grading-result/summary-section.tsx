import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";
import { Assessment } from "@/types/assessment";
import { Skeleton } from "@/components/ui/skeleton";
import GradingResultHelper from "@/lib/grading-result";
import { memo, useMemo } from "react";

const SummaryCardSkeleton = () => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col items-center p-4 bg-muted rounded-lg">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-2.5 w-full" />
        </div>
      ))}
    </div>
    <Skeleton className="h-4 w-48 mt-4" />
    <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[90%]" />
      <Skeleton className="h-4 w-[80%]" />
    </div>
  </>
);

interface SummarySectionProps {
  isLoading: boolean;
  assessments: Assessment[];
  scaleFactor: number;
}

const SummarySection = memo(function SummarySection({
  isLoading,
  assessments,
  scaleFactor,
}: SummarySectionProps) {
  const gradingHelper = useMemo(
    () => new GradingResultHelper(assessments, scaleFactor),
    [assessments, scaleFactor],
  );
  const averageScore = gradingHelper.getAverageScore();
  const highestScore = gradingHelper.getHighestScore();
  const lowestScore = gradingHelper.getLowestScore();

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ?
            <SummaryCardSkeleton />
          : <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-blue-600">Average Score</span>
                  <span className="text-3xl font-bold text-blue-600">{averageScore}</span>
                  <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{
                        width: `${Math.round((averageScore * 100) / scaleFactor)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-green-600">
                    Highest Score
                  </span>
                  <span className="text-3xl font-bold text-green-600">
                    {highestScore}
                  </span>
                  <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{
                        width: `${Math.round((highestScore * 100) / scaleFactor)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-red-600">Lowest Score</span>
                  <span className="text-3xl font-bold text-red-600">{lowestScore}</span>
                  <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-red-600 h-2.5 rounded-full"
                      style={{
                        width: `${Math.round((lowestScore * 100) / scaleFactor)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Total items graded: {assessments.length}
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Summary Report</h3>
                <p className="text-sm text-muted-foreground">
                  The summary report provides an overview of the grading results for the
                  selected assessments. It includes the average, highest, and lowest
                  scores achieved by students.
                </p>
              </div>
            </>
          }
        </CardContent>
      </Card>
    </section>
  );
});

export default SummarySection;
