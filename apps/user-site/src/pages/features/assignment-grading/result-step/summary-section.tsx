import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";
import { Assessment } from "@/types/assessment";
import { Skeleton } from "@/components/ui/skeleton";

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

type SummarySectionProps = {
  isLoading: boolean;
  assessments: Assessment[];
  mappedAssessments: {
    id: string;
    fileName: string;
    totalPercentage: number;
    criteria: {
      name: string;
      percentage: number;
    }[];
  }[];
};

export default function SummarySection({
  isLoading,
  assessments,
  mappedAssessments,
}: SummarySectionProps) {
  // Calculate summary statistics using mapped assessments
  const averageScore = assessments.length
    ? Math.round(
        mappedAssessments.reduce((sum, item) => sum + item.totalPercentage, 0) /
          mappedAssessments.length,
      )
    : 0;

  const highestScore = mappedAssessments.length
    ? Math.max(...mappedAssessments.map((item) => item.totalPercentage))
    : 0;
  const lowestScore = mappedAssessments.length
    ? Math.min(...mappedAssessments.map((item) => item.totalPercentage))
    : 0;

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
          {isLoading ? (
            <SummaryCardSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-blue-600">Average Score</span>
                  <span className="text-3xl font-bold text-blue-600">
                    {averageScore}%
                  </span>
                  <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${averageScore}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-green-600">
                    Highest Score
                  </span>
                  <span className="text-3xl font-bold text-green-600">
                    {highestScore}%
                  </span>
                  <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: `${highestScore}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-red-600">Lowest Score</span>
                  <span className="text-3xl font-bold text-red-600">{lowestScore}%</span>
                  <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-red-600 h-2.5 rounded-full"
                      style={{ width: `${lowestScore}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Total items graded: {mappedAssessments.length}
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Summary Report</h3>
                <p className="text-sm text-muted-foreground">
                  The summary report provides an overview of the grading results for the
                  selected assessments. It includes the average, highest, and lowest
                  scores achieved by students.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {mappedAssessments.filter((item) => item.totalPercentage >= 90).length >
                  0
                    ? `${mappedAssessments.filter((item) => item.totalPercentage >= 90).length} submissions achieved outstanding scores of 90% or above. `
                    : ""}
                  {mappedAssessments.filter((item) => item.totalPercentage < 70).length >
                  0
                    ? `${mappedAssessments.filter((item) => item.totalPercentage < 70).length} submissions scored below 70% and may require additional review. `
                    : ""}
                  Consider reviewing the detailed breakdown of each submission to identify
                  specific areas for improvement.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
