import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface AssessmentScoreDistributionChartProps {
  scoreDistribution: number[]; // Array of 10 numbers representing distribution
  scaleFactor: number;
  assessmentCount: number;
}

export function AssessmentScoreDistributionChart({
  scoreDistribution,
  scaleFactor,
  assessmentCount,
}: AssessmentScoreDistributionChartProps) {
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

  const uniqueCounts = Array.from(new Set(scoreDistribution.filter((c) => c > 0))).sort(
    (a, b) => a - b,
  );

  const yTicks = [0, ...uniqueCounts];

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="bin"
            label={{
              value: "Score Range",
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
          <Bar dataKey="count" name="Assessments" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
