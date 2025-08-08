import React, { useRef } from "react";
import { CriterionCard } from "./criterion-card";
import { CriterionScoreDistribution } from "@/types/analytics";
import { useVirtualizer } from "@tanstack/react-virtual";

interface VirtualizedCriterionListProps {
  criterionData: CriterionScoreDistribution[];
  scaleFactor: number;
  assessmentCount: number;
  chartColors: string[];
  columnsPerRow?: number;
}

const VirtualizedCriterionList = React.memo<VirtualizedCriterionListProps>(
  ({
    criterionData,
    scaleFactor,
    assessmentCount,
    chartColors,
    columnsPerRow = 2, // Default to 2 columns (xl:grid-cols-2)
  }) => {
    const parentRef = useRef<HTMLDivElement>(null);

    // Calculate how many rows we need based on columns per row
    const rowCount = Math.ceil(criterionData.length / columnsPerRow);

    // Virtualization setup for rows
    const virtualizer = useVirtualizer({
      count: rowCount,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 400, // Estimated height of each row of criterion cards
      overscan: 2, // Buffer rows for smooth scrolling
      measureElement:
        typeof ResizeObserver !== "undefined" ?
          (element) => element?.getBoundingClientRect().height
        : undefined,
    });

    // Group criteria into rows
    const getCriteriaForRow = (rowIndex: number) => {
      const startIndex = rowIndex * columnsPerRow;
      const endIndex = Math.min(startIndex + columnsPerRow, criterionData.length);
      return criterionData.slice(startIndex, endIndex);
    };

    // For small datasets, show all items without virtualization
    if (criterionData.length <= 8) {
      return (
        <div className="space-y-4">
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
      <div
        ref={parentRef}
        className="h-[70vh] max-h-[800px] min-h-[400px] overflow-auto border rounded-md"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const criteriaInRow = getCriteriaForRow(virtualRow.index);

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="space-y-4">
                  {criteriaInRow.map((criterion, columnIndex) => {
                    const globalIndex = virtualRow.index * columnsPerRow + columnIndex;
                    return (
                      <CriterionCard
                        key={criterion.criterionName}
                        criterionData={criterion}
                        scaleFactor={scaleFactor}
                        index={globalIndex}
                        assessmentCount={assessmentCount}
                        chartColors={chartColors}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

VirtualizedCriterionList.displayName = "VirtualizedCriterionList";

export { VirtualizedCriterionList };
