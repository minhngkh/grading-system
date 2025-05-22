import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { ScoreDistributionChart } from "./ScoreDistributionChart";
import { StatusDistributionChart } from "./StatusDistributionChart";
import type { AnalyticsData } from "@/types/analytics";

const mockData: AnalyticsData = {
  assessments: {
    total: 150,
    averageScore: 85.5,
    scoreDistribution: [
      { score: 90, count: 50 },
      { score: 80, count: 60 },
      { score: 70, count: 40 },
    ],
    recentAssessments: [],
  },
  gradings: {
    total: 200,
    statusDistribution: [
      { status: "Completed", count: 150 },
      { status: "Started", count: 30 },
      { status: "Failed", count: 20 },
    ],
    recentGradings: [],
  },
  rubrics: {
    total: 25,
    mostUsed: [],
    criteriaDistribution: [
      { criteria: "Code Quality", count: 20 },
      { criteria: "Documentation", count: 15 },
      { criteria: "Testing", count: 10 },
    ],
  },
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{mockData.assessments.total}</p>
            <p className="text-muted-foreground">
              Average Score: {mockData.assessments.averageScore}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Gradings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{mockData.gradings.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Rubrics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{mockData.rubrics.total}</p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div>Loading charts...</div>}>
        <div className="grid gap-4 md:grid-cols-2">
          <ScoreDistributionChart data={mockData.assessments.scoreDistribution} />
          <StatusDistributionChart data={mockData.gradings.statusDistribution} />
        </div>
      </Suspense>
    </div>
  );
}
