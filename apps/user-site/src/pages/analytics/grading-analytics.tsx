import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { GradingAnalytics } from "@/types/analytics";
import { AssessmentCriterionChart } from "./grading-criterion-chart";
import { AssessmentScoreDistributionChart } from "./grading-distribution-chart";
import { GradingAttempt } from "@/types/grading";
import { useAnalyticsData } from "@/hooks/use-analytics";

interface GradingAnalyticsPageProps {
  gradingAnalytics: GradingAnalytics;
  grading: GradingAttempt;
}

export function GradingAnalyticsPage({
  gradingAnalytics,
  grading,
}: GradingAnalyticsPageProps) {
  const { scaleFactor, averageScore, assessmentCount, scores, criterionData } =
    gradingAnalytics;

  // Use optimized analytics hook
  const { scoreDistribution, highestScore, lowestScore } = useAnalyticsData(scores);

  return (
    <div className="space-y-6">
      {/* Grading Summary Stats */}
      <Card className="gap-0">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1">
            <CardTitle>Grading Information</CardTitle>
            <CardDescription>
              Overview of the grading configuration and statistics
            </CardDescription>
          </div>
          <Button asChild size="sm">
            <Link to="/gradings/$gradingId/result" params={{ gradingId: grading.id }}>
              <ExternalLink className="w-4 h-4" />
              View Result
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
            <div className="flex flex-col justify-center">
              <span className="text-sm font-medium text-muted-foreground">Name</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold">{grading.name}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">
                Updated On
              </span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-base font-semibold">
                {grading.lastModified ?
                  new Date(grading.lastModified).toLocaleString()
                : new Date(grading.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-sm font-medium text-muted-foreground">Grade</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold">{scaleFactor}</span>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-sm font-medium text-muted-foreground">
                Total Assessments
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold">{assessmentCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Assessment Score Distribution</h2>
        <Card className="py-0">
          <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6">
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription className="hidden lg:block">
                Distribution of all assessment scores on a scale of {scaleFactor}
              </CardDescription>
            </div>
            <div className="flex">
              <div className="flex flex-1 flex-col justify-center gap-1 border-t px-3 py-2 text-left sm:border-t-0 sm:border-l sm:px-4 sm:py-3">
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  Highest Score
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {((highestScore / 100) * scaleFactor).toFixed(1)}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1 border-t px-3 py-2 text-left border-l sm:border-t-0 sm:border-l sm:px-4 sm:py-3">
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  Lowest Score
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {((lowestScore / 100) * scaleFactor).toFixed(1)}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1 border-t px-3 py-2 text-left border-l sm:border-t-0 sm:border-l sm:px-4 sm:py-3">
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  Average Score
                </span>
                <span
                  className="text-lg leading-none font-bold sm:text-3xl"
                  style={{ color: "var(--chart-1)" }}
                >
                  {((averageScore / 100) * scaleFactor).toFixed(1)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2">
            <AssessmentScoreDistributionChart
              scoreDistribution={scoreDistribution}
              scaleFactor={scaleFactor}
              assessmentCount={assessmentCount}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Criteria Distribution</h2>
        <AssessmentCriterionChart
          assessmentCount={assessmentCount}
          criterionData={criterionData}
          scaleFactor={scaleFactor}
        />
      </div>
    </div>
  );
}
