import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CriterionScoreDistribution } from "@/types/analytics";
import { getScoreDistribution } from "@/lib/analytics";

interface AssessmentCriterionChartProps {
  criterionData: CriterionScoreDistribution[];
  scaleFactor: number;
  assessmentCount: number;
}

const RANGE_COUNT = 6;
const chartColors = ["#2563eb", "#db2777", "#16a34a", "#ea580c", "#8b5cf6"];

export function AssessmentCriterionChart({
  criterionData,
  scaleFactor,
  assessmentCount,
}: AssessmentCriterionChartProps) {
  const [usePercentScore, setUsePercentScore] = useState(false);

  const chartData = useMemo(() => {
    const stepPercent = 100 / RANGE_COUNT;

    return criterionData.map((criterion) => {
      const scoreDistribution = getScoreDistribution(
        criterion.scores,
        criterion.totalWeight,
        RANGE_COUNT,
      );

      const scoreMultiplier =
        usePercentScore ?
          criterion.totalWeight / 100
        : (scaleFactor * criterion.totalWeight) / 10000;

      const chartPoints = scoreDistribution.map((count, index) => {
        const minPercent = index * stepPercent;
        const maxPercent = (index + 1) * stepPercent;
        const midPercent = (minPercent + maxPercent) / 2;

        const minScore = minPercent * scoreMultiplier;
        const maxScore = maxPercent * scoreMultiplier;
        const midScore = midPercent * scoreMultiplier;

        return {
          bin:
            usePercentScore ?
              `${minScore.toFixed(0)}%-${maxScore.toFixed(0)}%`
            : `${minScore.toFixed(1)}-${maxScore.toFixed(1)}`,
          count,
          criterionName: criterion.criterionName,
          midScore,
        };
      });

      const rawAvg =
        criterion.scores.length > 0 ?
          criterion.scores.reduce((sum, score) => sum + score, 0) /
          criterion.scores.length
        : 0;

      return {
        ...criterion,
        chartPoints,
        averageScore: usePercentScore ? rawAvg : rawAvg / 10,
        maxScore:
          usePercentScore ?
            criterion.totalWeight
          : (scaleFactor * criterion.totalWeight) / 100,
      };
    });
  }, [criterionData, scaleFactor, usePercentScore]);

  if (criterionData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chart Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="percent-score"
              checked={usePercentScore}
              onCheckedChange={(checked) => setUsePercentScore(checked as boolean)}
            />
            <label htmlFor="percent-score" className="text-sm font-medium">
              Use percent score instead of final score
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {chartData.map((criterion, index) => {
          const yTicks = [
            0,
            ...new Set(criterion.chartPoints.map((p) => p.count).filter((c) => c > 0)),
          ].sort((a, b) => a - b);

          return (
            <Card key={criterion.criterionName}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{criterion.criterionName}</CardTitle>
                    <CardDescription className="mt-1">
                      Distribution of scores in{" "}
                      {usePercentScore ?
                        `${(criterion.maxScore / RANGE_COUNT).toFixed(0)}%`
                      : `${(criterion.maxScore / RANGE_COUNT).toFixed(1)}`}{" "}
                      ranges
                      {!usePercentScore && ` on a scale of ${criterion.maxScore}`}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-gray-600 mr-1">Average:</span>
                      <span
                        className="text-2xl font-bold"
                        style={{
                          color: chartColors[index % chartColors.length],
                        }}
                      >
                        {usePercentScore ?
                          `${criterion.averageScore.toFixed(0)}%`
                        : criterion.averageScore.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">/</span>
                      <span className="text-lg font-semibold text-gray-800">
                        {usePercentScore ?
                          `${criterion.totalWeight}%`
                        : criterion.maxScore}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={criterion.chartPoints}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="bin"
                        label={{
                          value:
                            usePercentScore ? "Score Range (Percentage)" : "Score Range",
                          position: "insideBottom",
                          offset: -40,
                        }}
                        dy={10}
                      />
                      <YAxis
                        domain={[0, Math.max(...yTicks)]}
                        ticks={yTicks}
                        label={{
                          value: "Number of Assessments",
                          angle: -90,
                          position: "middleLeft",
                          dx: -20,
                        }}
                        dx={-5}
                      />
                      <Tooltip
                        formatter={(v) => [v, "Assessments"]}
                        labelFormatter={(label, payload) => {
                          const data = payload?.[0]?.payload;
                          return data ?
                              `${data.count} out of ${assessmentCount} assessments in range ${data.bin}`
                            : label;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name={criterion.criterionName}
                        stroke={chartColors[index % chartColors.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
