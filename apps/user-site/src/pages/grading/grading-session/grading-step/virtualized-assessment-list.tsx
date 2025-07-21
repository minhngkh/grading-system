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
      estimateSize: () => 210, // Card height + padding bottom (16px)
      overscan: 3, // Number of items to render outside visible area
      measureElement:
        typeof ResizeObserver !== "undefined" ?
          (element) => element?.getBoundingClientRect().height
        : undefined,
    });

    return (
      <div
        ref={parentRef}
        className="pl-1 pr-2 h-[30vh] max-h-[800px] custom-scrollbar overflow-auto"
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
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="space-y-4">
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
