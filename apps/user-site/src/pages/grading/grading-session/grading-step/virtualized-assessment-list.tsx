import { AssessmentStatusCard } from "@/pages/grading/grading-session/grading-step/status-card";
import { AssessmentGradingStatus } from "@/types/grading-progress";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useRef } from "react";

// Virtualized Assessment List Component
interface VirtualizedAssessmentListProps {
  assessments: AssessmentGradingStatus[];
  gradingId: string;
  onRegrade: (assessmentId: string) => void;
}

export const VirtualizedAssessmentList = memo(
  ({ assessments, gradingId, onRegrade }: VirtualizedAssessmentListProps) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
      count: assessments.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 180, // Base estimate, will be adjusted by measurement
      overscan: 5, // Increased overscan for better UX with dynamic heights
      measureElement:
        typeof ResizeObserver !== "undefined" ?
          (element) => element?.getBoundingClientRect().height
        : undefined,
      // Enable dynamic measurement for better handling of variable heights
      getItemKey: (index) => assessments[index]?.assessmentId || index,
    });

    return (
      <div
        ref={parentRef}
        className="pl-1 pr-2 min-h-[200px] max-h-[800px] custom-scrollbar overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div style={{ paddingBottom: "20px" }}>
                <AssessmentStatusCard
                  status={assessments[virtualItem.index]}
                  gradingId={gradingId}
                  onRegrade={onRegrade}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
