"use client";

import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CHART_CONFIG } from "@/consts/chart-config";

interface AssessmentScoreDistributionChartProps {
  scoreDistribution: number[]; // Array of 10 numbers representing distribution
  scaleFactor: number;
  assessmentCount: number;
}

// Memoize chart config to prevent recreation
const chartConfig = CHART_CONFIG;

const AssessmentScoreDistributionChart =
  React.memo<AssessmentScoreDistributionChartProps>(
    ({ scoreDistribution, scaleFactor, assessmentCount }) => {
      // Transform the distribution array into chart data
      const chartData = useMemo(() => {
        return scoreDistribution.map((count, index) => {
          const minPercent = index * 10;
          const maxPercent = (index + 1) * 10;
          const minScore = (scaleFactor * minPercent) / 100;
          const maxScore = (scaleFactor * maxPercent) / 100;

          return {
            bin: `${minScore.toFixed(1)}-${maxScore.toFixed(1)}`,
            count,
            minScore,
            maxScore,
            range: `${minScore.toFixed(1)} - ${maxScore.toFixed(1)}`,
          };
        });
      }, [scoreDistribution, scaleFactor]);

      if (assessmentCount === 0) {
        return (
          <div className="flex justify-center items-center h-64 text-muted-foreground">
            No data available
          </div>
        );
      }

      return (
        <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="bin"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[200px]"
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `Score Range: ${data.range}`;
                    }
                    return `Score Range: ${label}`;
                  }}
                  formatter={(value) => `${value} assessment(s)`}
                />
              }
            />
            <Bar dataKey="count" fill="var(--chart-1)" radius={8}>
              <LabelList position="top" offset={6} className="fill-foreground" />
            </Bar>
          </BarChart>
        </ChartContainer>
      );
    },
  );

AssessmentScoreDistributionChart.displayName = "AssessmentScoreDistributionChart";

export { AssessmentScoreDistributionChart };
