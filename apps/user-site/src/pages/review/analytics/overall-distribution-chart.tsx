import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface OverallGradingDistributionChartProps {
  gradingDistribution: number[]; // Array of 10 numbers representing distribution
}

export function OverallGradingDistributionChart({
  gradingDistribution,
}: OverallGradingDistributionChartProps) {
  // Transform the distribution array into chart data
  const chartData = gradingDistribution.map((count, index) => {
    const min = index * 10;
    const max = (index + 1) * 10;
    return {
      range: `${min}-${max}%`,
      count,
      min,
      max,
    };
  });

  const uniqueCounts = Array.from(new Set(gradingDistribution.filter((c) => c > 0))).sort(
    (a, b) => a - b,
  );

  const yTicks = [0, ...uniqueCounts];

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="range"
            label={{
              value: "Average Score Range",
              position: "insideBottom",
              offset: -40,
            }}
            dy={10}
          />
          <YAxis
            domain={[0, Math.max(...yTicks)]}
            ticks={yTicks}
            label={{
              value: "Number of Gradings",
              angle: -90,
              position: "middleLeft",
              dx: -20,
            }}
            dx={-5}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === "count") return [value, "Number of Gradings"];
              return [value, name];
            }}
            labelFormatter={(label) => `Score Range: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Number of Gradings"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 6 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
