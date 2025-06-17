import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OverallGradingDistributionChart } from "./overall-distribution-chart";
import { OverallGradingAnalytics } from "@/types/analytics";
import { getScoreDistribution } from "@/lib/analytics";

interface OverallAnalyticsPageProps {
  analytics: OverallGradingAnalytics;
}

export function OverallAnalyticsPage({ analytics }: OverallAnalyticsPageProps) {
  const scoreDistribution = getScoreDistribution(analytics.scores);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of all grading activities and performance metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="gap-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gradings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalGradings}</div>
            <p className="text-xs text-muted-foreground">
              Different grading scales used for assessments
            </p>
          </CardContent>
        </Card>
        <Card className="gap-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              Assessments that have been graded
            </p>
          </CardContent>
        </Card>
        <Card className="gap-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average percent score across all assessments
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribution of Grading Average Scores</CardTitle>
          <CardDescription>
            Distribution of average scores across all gradings, grouped in 10% ranges.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <OverallGradingDistributionChart gradingDistribution={scoreDistribution} />
        </CardContent>
      </Card>
    </div>
  );
}
