import { useMemo } from "react";
import { CriterionScoreDistribution } from "@/types/analytics";
import { getScoreDistribution } from "@/lib/analytics";

// Custom hook to memoize analytics calculations
export function useAnalyticsData(scores: number[]) {
  return useMemo(() => {
    if (scores.length === 0) {
      return {
        scoreDistribution: new Array(10).fill(0),
        highestScore: 0,
        lowestScore: 0,
      };
    }

    const scoreDistribution = getScoreDistribution(scores);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    return {
      scoreDistribution,
      highestScore,
      lowestScore,
    };
  }, [scores]);
}

// Custom hook to memoize criterion chart data
export function useCriterionChartData(
  criterionData: CriterionScoreDistribution[],
  scaleFactor: number,
) {
  return useMemo(() => {
    if (criterionData.length === 0) {
      return { processedData: [], isEmpty: true };
    }

    // Pre-process criterion data to avoid recalculations in components
    const processedData = criterionData.map((criterion, index) => ({
      ...criterion,
      index,
      id: `${criterion.criterionName}-${index}`, // Stable key for React
    }));

    return { processedData, isEmpty: false };
  }, [criterionData, scaleFactor]);
}
