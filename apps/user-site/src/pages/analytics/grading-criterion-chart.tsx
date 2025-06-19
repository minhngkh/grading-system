import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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

export function AssessmentCriterionChart({
  criterionData,
  scaleFactor,
  assessmentCount,
}: AssessmentCriterionChartProps) {
  const [usePercentScore, setUsePercentScore] = useState(false);
  const [combinedChart, setCombinedChart] = useState(false);

  // Transform criterion data for charts
  const chartData = useMemo(() => {
    return criterionData.map((criterion) => {
      const scoreDistribution = getScoreDistribution(criterion.scores);

      const chartPoints = scoreDistribution.map((count, index) => {
        const minPercent = index * 10;
        const maxPercent = (index + 1) * 10;
        const minScore =
          usePercentScore ? minPercent : (
            (scaleFactor * minPercent * criterion.totalWeight) / 10000
          );
        const maxScore =
          usePercentScore ? maxPercent : (
            (scaleFactor * maxPercent * criterion.totalWeight) / 10000
          );

        return {
          bin:
            usePercentScore ? `${minPercent}%-${maxPercent}%` : `${minScore}-${maxScore}`,
          count,
          criterionName: criterion.criterionName,
        };
      });

      // Calculate average score for this criterion
      let totalScore = 0;
      let totalCount = 0;

      scoreDistribution.forEach((count, index) => {
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
  }, [criterionData, scaleFactor, usePercentScore]);

  // Create combined chart data
  const combinedChartData = useMemo(() => {
    if (!combinedChart || chartData.length === 0) return [];

    const allBins = new Set<string>();
    chartData.forEach((criterion) => {
      criterion.chartPoints.forEach((point) => allBins.add(point.bin));
    });

    return Array.from(allBins)
      .sort()
      .map((bin) => {
        const dataPoint: any = { bin };
        chartData.forEach((criterion) => {
          const point = criterion.chartPoints.find((p) => p.bin === bin);
          dataPoint[criterion.criterionName] = point ? point.count : 0;
        });
        return dataPoint;
      });
  }, [chartData, combinedChart]);

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
    <div className="space-y-6">
      {/* Controls */}
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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="combined-chart"
              checked={combinedChart}
              onCheckedChange={(checked) => setCombinedChart(checked as boolean)}
            />
            <label htmlFor="combined-chart" className="text-sm font-medium">
              Combine all criteria in one chart
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Combined Chart */}
      {combinedChart ?
        <Card>
          <CardHeader>
            <CardTitle>Combined Criteria Score Distribution</CardTitle>
            <CardDescription>
              Distribution of scores across all criteria in 10% ranges
              {usePercentScore ? " (Percentage)" : ` (Scale of ${scaleFactor})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={combinedChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="bin"
                    label={{
                      value: usePercentScore ? "Score Range (Percentage)" : "Score Range",
                      position: "insideBottom",
                      offset: -40,
                    }}
                    dy={10}
                  />
                  <YAxis
                    label={{
                      value: "Number of Assessments",
                      angle: -90,
                      position: "middleLeft",
                      dx: -20,
                    }}
                    dx={-5}
                  />
                  <Tooltip formatter={(value, name) => [value, `${name} Assessments`]} />
                  <Legend />
                  {chartData.map((criterion, index) => (
                    <Line
                      key={criterion.criterionName}
                      type="monotone"
                      dataKey={criterion.criterionName}
                      stroke={chartColors[index % chartColors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      : /* Individual Charts */
        <div className="space-y-8">
          {chartData.map((criterion, index) => {
            const scoreDistribution = getScoreDistribution(criterion.scores);
            const uniqueCounts = Array.from(
              new Set(scoreDistribution.filter((c) => c > 0)),
            ).sort((a, b) => a - b);

            const yTicks = [0, ...uniqueCounts];
            const maxScore =
              usePercentScore ? 100 : (scaleFactor * criterion.totalWeight) / 100;
            const averageScore =
              usePercentScore ?
                criterion.averagePercentage * 100
              : (criterion.averagePercentage * scaleFactor * criterion.totalWeight) / 100;

            return (
              <Card key={criterion.criterionName}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{criterion.criterionName}</CardTitle>
                      <CardDescription>
                        Distribution of scores in 10% ranges
                        {usePercentScore ?
                          " (Percentage)"
                        : ` on a scale of ${scaleFactor * criterion.totalWeight}`}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-gray-600 mr-1">Average:</span>
                        <span
                          className="text-2xl font-bold"
                          style={{ color: chartColors[index % chartColors.length] }}
                        >
                          {usePercentScore ?
                            `${averageScore.toFixed(1)}%`
                          : averageScore.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">/</span>
                        <span className="text-lg font-semibold text-gray-800">
                          {usePercentScore ? "100%" : maxScore}
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
                              usePercentScore ?
                                "Score Range (Percentage)"
                              : "Score Range",
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
                              return `${data.count} out of ${assessmentCount} assessments in range ${data.bin}`;
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
      }
    </div>
  );
}
