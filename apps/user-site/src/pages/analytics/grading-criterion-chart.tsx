import React, { useState, useCallback } from "react";
import { CriterionScoreDistribution } from "@/types/analytics";
import { CombinedCriterionChart } from "./combined-criterion-chart";
import { LazyLoadedCriterionList } from "./virtualized-criterion-list";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp } from "lucide-react";
import { CHART_COLORS } from "@/consts/chart-config";

interface AssessmentCriterionChartProps {
  criterionData: CriterionScoreDistribution[];
  scaleFactor: number;
  assessmentCount: number;
}

// Memoize chart colors to prevent recreation on every render
const chartColors = CHART_COLORS;

const AssessmentCriterionChart = React.memo<AssessmentCriterionChartProps>(
  ({ criterionData, scaleFactor, assessmentCount }) => {
    const [isCombinedView, setIsCombinedView] = useState(false);

    // Memoize toggle handlers to prevent child re-renders
    const handleToggleIndividual = useCallback(() => setIsCombinedView(false), []);
    const handleToggleCombined = useCallback(() => setIsCombinedView(true), []);

    // Early return if no data
    if (criterionData.length === 0) {
      return (
        <div className="flex justify-center items-center h-64 text-muted-foreground">
          No data available
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Toggle buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={!isCombinedView ? "default" : "outline"}
            size="sm"
            onClick={handleToggleIndividual}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Individual Criterion
          </Button>
          <Button
            variant={isCombinedView ? "default" : "outline"}
            size="sm"
            onClick={handleToggleCombined}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Combined Criterion
          </Button>
        </div>

        {/* Chart content */}
        {isCombinedView ?
          <CombinedCriterionChart
            criterionData={criterionData}
            chartColors={chartColors}
          />
        : <LazyLoadedCriterionList
            criterionData={criterionData}
            scaleFactor={scaleFactor}
            assessmentCount={assessmentCount}
            chartColors={chartColors}
          />
        }
      </div>
    );
  },
);

AssessmentCriterionChart.displayName = "AssessmentCriterionChart";

export { AssessmentCriterionChart };
