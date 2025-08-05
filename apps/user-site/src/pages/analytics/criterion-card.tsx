import React, { useMemo, useState, useCallback } from "react";
import { CartesianGrid, Area, AreaChart, XAxis, LabelList } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Switch } from "@/components/ui/switch";
import { CriterionScoreDistribution } from "@/types/analytics";
import { getScoreDistribution } from "@/lib/analytics";
import { RANGE_COUNT } from "@/consts/chart-config";

interface CriterionCardProps {
  criterionData: CriterionScoreDistribution;
  scaleFactor: number;
  index: number;
  assessmentCount: number;
  chartColors: string[];
}

const CriterionCard = React.memo<CriterionCardProps>(
  ({ criterionData, scaleFactor, index, chartColors }) => {
    const [isPercentMode, setIsPercentMode] = useState(false);

    // Memoize the toggle handler to prevent unnecessary re-renders
    const handleTogglePercent = useCallback((checked: boolean) => {
      setIsPercentMode(checked);
    }, []);

    const chartData = useMemo(() => {
      const stepPercent = 100 / RANGE_COUNT;

      const scoreDistribution = getScoreDistribution(
        criterionData.scores,
        criterionData.totalWeight,
        RANGE_COUNT,
      );

      const scoreMultiplier =
        isPercentMode ?
          criterionData.totalWeight / 100
        : (scaleFactor * criterionData.totalWeight) / 10000;

      const chartPoints = scoreDistribution.map((count, pointIndex) => {
        const minPercent = pointIndex * stepPercent;
        const maxPercent = (pointIndex + 1) * stepPercent;

        const minScore = minPercent * scoreMultiplier;
        const maxScore = maxPercent * scoreMultiplier;

        return {
          bin:
            isPercentMode ?
              `${minScore.toFixed(0)}%-${maxScore.toFixed(0)}%`
            : `${minScore.toFixed(1)}-${maxScore.toFixed(1)}`,
          count,
          criterionName: criterionData.criterionName,
          range:
            isPercentMode ?
              `${minScore.toFixed(0)}% - ${maxScore.toFixed(0)}%`
            : `${minScore.toFixed(1)} - ${maxScore.toFixed(1)}`,
        };
      });

      const rawAvg =
        criterionData.scores.length > 0 ?
          criterionData.scores.reduce((sum, score) => sum + score, 0) /
          criterionData.scores.length
        : 0;

      const rawMin =
        criterionData.scores.length > 0 ? Math.min(...criterionData.scores) : 0;

      const chartConfig = {
        count: {
          label: criterionData.criterionName,
          color: chartColors[index % chartColors.length],
        },
      };

      return {
        chartPoints,
        chartConfig,
        averageScore: isPercentMode ? rawAvg : (rawAvg * scaleFactor) / 100,
        minScore: isPercentMode ? rawMin : (rawMin * scaleFactor) / 100,
        maxScore: isPercentMode ? 100 : (scaleFactor * criterionData.totalWeight) / 100,
      };
    }, [criterionData, scaleFactor, isPercentMode, index, chartColors]);

    return (
      <Card className="py-0">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 lg:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 p-3 sm:px-4 md:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="truncate">{criterionData.criterionName}</CardTitle>
              <div className="flex items-center space-x-2">
                <label
                  htmlFor={`percent-${criterionData.criterionName}`}
                  className="text-[10px] sm:text-xs text-muted-foreground"
                >
                  Percentage
                </label>
                <Switch
                  id={`percent-${criterionData.criterionName}`}
                  checked={isPercentMode}
                  onCheckedChange={handleTogglePercent}
                />
              </div>
            </div>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm">
              Distribution of scores in range of{" "}
              {isPercentMode ? "20%" : `${(chartData.maxScore / RANGE_COUNT).toFixed(1)}`}
            </CardDescription>
          </div>
          <div className="grid grid-cols-3 sm:flex">
            <div className="flex flex-1 flex-col justify-center gap-1 border-t px-3 py-2 text-center md:border-r lg:border-l sm:px-4 sm:py-3 lg:border-t-0 lg:text-left">
              <span className="text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">
                Highest Score
              </span>
              <span className="text-xs leading-none font-bold sm:text-sm md:text-base lg:text-lg xl:text-2xl">
                {isPercentMode ?
                  `${chartData.maxScore.toFixed(0)}%`
                : chartData.maxScore.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 border-t px-3 py-2 text-center md:border-r lg:border-l sm:px-4 sm:py-3 lg:border-t-0 lg:text-left">
              <span className="text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">
                Lowest Score
              </span>
              <span className="text-xs leading-none font-bold sm:text-sm md:text-base lg:text-lg xl:text-2xl">
                {isPercentMode ?
                  `${chartData.minScore.toFixed(0)}%`
                : chartData.minScore.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 border-t px-3 py-2 text-center sm:border-l sm:px-4 sm:py-3 lg:border-t-0 lg:text-left lg:px-4 xl:px-6">
              <span className="text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">
                Average Score
              </span>
              <span
                className="text-xs leading-none font-bold sm:text-sm md:text-base lg:text-lg xl:text-2xl"
                style={{
                  color: chartColors[index % chartColors.length],
                }}
              >
                {isPercentMode ?
                  `${chartData.averageScore.toFixed(0)}%`
                : chartData.averageScore.toFixed(1)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-4">
          <ChartContainer
            config={chartData.chartConfig}
            className="aspect-auto h-[250px] w-full sm:h-[300px]"
          >
            <AreaChart
              accessibilityLayer
              data={chartData.chartPoints}
              margin={{
                left: 32,
                right: 32,
                top: 40,
                bottom: 20,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="bin"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
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
              <Area
                dataKey="count"
                type="linear"
                fill={`var(--color-count)`}
                fillOpacity={0.4}
                stroke={`var(--color-count)`}
                strokeWidth={2}
              >
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Area>
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  },
);

CriterionCard.displayName = "CriterionCard";

export { CriterionCard };
