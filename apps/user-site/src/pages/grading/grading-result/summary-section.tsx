import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";
import { Assessment } from "@/types/assessment";
import GradingResultHelper from "@/lib/grading-result";
import { memo, useMemo } from "react";

interface SummarySectionProps {
  assessments: Assessment[];
  scaleFactor: number;
}

const SummarySection = memo(function SummarySection({
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium text-blue-600">Average Score</span>
              <span className="text-3xl font-bold text-blue-600">
                {averageScore.toFixed(2)}
              </span>
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
              <span className="text-sm font-medium text-green-600">Highest Score</span>
              <span className="text-3xl font-bold text-green-600">
                {highestScore.toFixed(2)}
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
              <span className="text-3xl font-bold text-red-600">
                {lowestScore.toFixed(2)}
              </span>
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
          <div className="mt-4 text-sm font-semibold text-muted-foreground">
            Total items graded: {assessments.length}
          </div>
        </CardContent>
      </Card>
    </section>
  );
});

export default SummarySection;
