import { useMemo } from "react";
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
import { CriterionScoreDistribution } from "@/types/analytics";

interface AssessmentCriterionChartProps {
  criterionData: CriterionScoreDistribution[];
  scaleFactor: number;
}

export function AssessmentCriterionChart({
  criterionData,
  scaleFactor,
}: AssessmentCriterionChartProps) {
  // Transform criterion data for charts
  const chartData = useMemo(() => {
    return criterionData.map((criterion) => {
      const chartPoints = criterion.scoreDistribution.map((count, index) => {
        const minPercent = index * 10;
        const maxPercent = (index + 1) * 10;
        const minScore = (scaleFactor * minPercent) / 100;
        const maxScore = (scaleFactor * maxPercent) / 100;

        return {
          bin: `${minPercent}-${maxPercent}%`,
          range: `${(minScore * criterion.totalWeight).toFixed(1)}-${(maxScore * criterion.totalWeight).toFixed(1)}`,
          count,
        };
      });

      // Calculate average score for this criterion
      let totalScore = 0;
      let totalCount = 0;

      criterion.scoreDistribution.forEach((count, index) => {
        const midPercent = (index * 10 + (index + 1) * 10) / 2; // Midpoint of bin
        totalScore += (midPercent / 100) * count;
        totalCount += count;
      });

      const averagePercentage = totalCount > 0 ? totalScore / totalCount : 0;

      return {
        ...criterion,
        chartPoints,
        averagePercentage: averagePercentage,
      };
    });
  }, [criterionData, scaleFactor]);

  if (criterionData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        No data available
      </div>
    );
  }

  // Define colors for the charts
  const chartColors = [
    "#2563eb", // blue-600
    "#db2777", // pink-600
    "#16a34a", // green-600
    "#ea580c", // orange-600
    "#8b5cf6", // violet-500
  ];

  return (
    <div className="space-y-8">
      {chartData.map((criterion, index) => {
        const uniqueCounts = Array.from(
          new Set(criterion.scoreDistribution.filter((c) => c > 0)),
        ).sort((a, b) => a - b);

        const yTicks = [0, ...uniqueCounts];
        return (
          <Card key={criterion.criterionName}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{criterion.criterionName}</CardTitle>
                  <CardDescription>
                    Distribution of scores in 10% ranges on a scale of{" "}
                    {scaleFactor * criterion.totalWeight}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-gray-600 mr-1">Average:</span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: chartColors[index % chartColors.length] }}
                    >
                      {(
                        criterion.averagePercentage *
                        scaleFactor *
                        criterion.totalWeight
                      ).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">/</span>
                    <span className="text-lg font-semibold text-gray-800">
                      {scaleFactor * criterion.totalWeight}
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
                        value: "Score Range (Percentage)",
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
                      formatter={(value) => [value, "Assessments"]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `${label} (${data.range} out of ${scaleFactor * criterion.totalWeight})`;
                        }
                        return label;
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
  );
}
