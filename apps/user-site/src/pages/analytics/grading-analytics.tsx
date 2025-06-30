import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GradingAnalytics } from "@/types/analytics";
import { AssessmentCriterionChart } from "./grading-criterion-chart";
import { AssessmentScoreDistributionChart } from "./grading-distribution-chart";
import { getScoreDistribution } from "@/lib/analytics";

interface GradingAnalyticsPageProps {
  gradingAnalytics: GradingAnalytics;
}

export function GradingAnalyticsPage({ gradingAnalytics }: GradingAnalyticsPageProps) {
  const { scaleFactor, averageScore, assessmentCount, scores, criterionData } =
    gradingAnalytics;
  const scoreDistribution = getScoreDistribution(scores);

  return (
    <div className="space-y-6">
      {/* Grading Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="gap-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scaleFactor}</div>
            <p className="text-xs text-muted-foreground">Maximum possible score</p>
          </CardContent>
        </Card>
        <Card className="gap-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((averageScore / 100) * scaleFactor).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">out of {scaleFactor}</p>
          </CardContent>
        </Card>
        <Card className="gap-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Number of Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessmentCount}</div>
            <p className="text-xs text-muted-foreground">
              Total assessments in this grading
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overall" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overall">Overall Scores</TabsTrigger>
          <TabsTrigger value="criteria">Criteria Scores</TabsTrigger>
        </TabsList>
        <TabsContent value="overall">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Score Distribution</CardTitle>
              <CardDescription>
                Distribution of total assessment scores on a scale of {scaleFactor}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <AssessmentScoreDistributionChart
                scoreDistribution={scoreDistribution}
                scaleFactor={scaleFactor}
                assessmentCount={assessmentCount}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="criteria" className="mt-4">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Criterion Score Distributions</h3>
            <AssessmentCriterionChart
              assessmentCount={assessmentCount}
              criterionData={criterionData}
              scaleFactor={scaleFactor}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
