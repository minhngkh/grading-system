import React, { useMemo, useState, useCallback } from "react";
import { CriterionCard } from "./criterion-card";
import { CriterionScoreDistribution } from "@/types/analytics";
import { Button } from "@/components/ui/button";

interface LazyLoadedCriterionListProps {
  criterionData: CriterionScoreDistribution[];
  scaleFactor: number;
  assessmentCount: number;
  chartColors: string[];
  initialItemsToShow?: number;
  itemsPerLoad?: number;
}

const LazyLoadedCriterionList = React.memo<LazyLoadedCriterionListProps>(
  ({
    criterionData,
    scaleFactor,
    assessmentCount,
    chartColors,
    initialItemsToShow = 4,
    itemsPerLoad = 4,
  }) => {
    const [visibleCount, setVisibleCount] = useState(
      Math.min(initialItemsToShow, criterionData.length),
    );

    const visibleItems = useMemo(
      () => criterionData.slice(0, visibleCount),
      [criterionData, visibleCount],
    );

    const loadMore = useCallback(() => {
      setVisibleCount((prev) => Math.min(prev + itemsPerLoad, criterionData.length));
    }, [itemsPerLoad, criterionData.length]);

    const hasMore = visibleCount < criterionData.length;

    // For small datasets, show all items immediately
    if (criterionData.length <= initialItemsToShow) {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {criterionData.map((criterion, index) => (
            <CriterionCard
              key={criterion.criterionName}
              criterionData={criterion}
              scaleFactor={scaleFactor}
              index={index}
              assessmentCount={assessmentCount}
              chartColors={chartColors}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {visibleItems.map((criterion, index) => (
            <CriterionCard
              key={criterion.criterionName}
              criterionData={criterion}
              scaleFactor={scaleFactor}
              index={index}
              assessmentCount={assessmentCount}
              chartColors={chartColors}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <Button onClick={loadMore} variant="outline" size="sm">
              Load More Criteria ({criterionData.length - visibleCount} remaining)
            </Button>
          </div>
        )}
      </div>
    );
  },
);

LazyLoadedCriterionList.displayName = "LazyLoadedCriterionList";

export { LazyLoadedCriterionList };
