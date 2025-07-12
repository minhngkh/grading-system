import React, { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CriterionScoreDistribution } from "@/types/analytics";
import { getScoreDistribution } from "@/lib/analytics";

interface CombinedCriterionChartProps {
  criterionData: CriterionScoreDistribution[];
  chartColors: string[];
}

const CombinedCriterionChart = React.memo<CombinedCriterionChartProps>(
  ({ criterionData, chartColors }) => {
    const RANGE_COUNT = 5;

    const chartData = useMemo(() => {
      const stepPercent = 100 / RANGE_COUNT;

      // Create the base data structure with percentage ranges
      const combinedData: Array<Record<string, any>> = Array.from(
        { length: RANGE_COUNT },
        (_, index) => {
          const minPercent = index * stepPercent;
          const maxPercent = (index + 1) * stepPercent;

          return {
            range: `${minPercent.toFixed(0)}%-${maxPercent.toFixed(0)}%`,
            rangeLabel: `${minPercent.toFixed(0)}% - ${maxPercent.toFixed(0)}%`,
          };
        },
      );

      // Add data for each criterion
      criterionData.forEach((criterion) => {
        const scoreDistribution = getScoreDistribution(
          criterion.scores,
          criterion.totalWeight,
          RANGE_COUNT,
        );

        scoreDistribution.forEach((count, rangeIndex) => {
          combinedData[rangeIndex][criterion.criterionName] = count;
        });
      });

      // Create chart config
      const chartConfig: Record<string, { label: string; color: string }> = {};
      criterionData.forEach((criterion, index) => {
        chartConfig[criterion.criterionName] = {
          label: criterion.criterionName,
          color: chartColors[index % chartColors.length],
        };
      });

      return { combinedData, chartConfig };
    }, [criterionData, chartColors]);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Combined Criterion Score Distribution</CardTitle>
          <CardDescription>
            Distribution of all criteria scores in percentage ranges (20% intervals)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartData.chartConfig}
            className="aspect-auto h-[400px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={chartData.combinedData}
              margin={{
                left: 10,
                right: 10,
                top: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="range"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                label={{
                  value: "Number of Assessments",
                  angle: -90,
                  position: "centerLeft",
                  dx: -20,
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[250px]"
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload;
                        return `Score Range: ${data.rangeLabel}`;
                      }
                      return `Score Range: ${label}`;
                    }}
                    formatter={(value, name) => `${name}: ${value} assessment(s)`}
                  />
                }
              />
              <Legend />
              {criterionData.map((criterion, index) => (
                <Line
                  key={criterion.criterionName}
                  dataKey={criterion.criterionName}
                  type="monotone"
                  stroke={chartColors[index % chartColors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  },
);

CombinedCriterionChart.displayName = "CombinedCriterionChart";

export { CombinedCriterionChart };
