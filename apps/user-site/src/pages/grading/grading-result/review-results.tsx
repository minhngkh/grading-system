import { Assessment } from "@/types/assessment";
import { createCriteriaColorMap } from "./colors";
import { memo, useState, useMemo, useRef } from "react";
import { AssessmentResultCard } from "@/pages/grading/grading-result/result-card";
import { Input } from "@/components/ui/input";
import { FilterSortDropdown } from "./filter-sort-dropdown";
import { Search } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface ReviewResultsProps {
  assessments: Assessment[];
  scaleFactor: number;
}

const ReviewResults = memo(function ReviewResults({
  assessments,
  scaleFactor,
}: ReviewResultsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const [appliedMinScore, setAppliedMinScore] = useState("");
  const [appliedMaxScore, setAppliedMaxScore] = useState("");
  const [appliedSortOrder, setAppliedSortOrder] = useState<"asc" | "desc" | "none">(
    "none",
  );

  const handleApplyFilters = (
    minScore: string,
    maxScore: string,
    sortOrder: "asc" | "desc" | "none",
  ) => {
    setAppliedMinScore(minScore);
    setAppliedMaxScore(maxScore);
    setAppliedSortOrder(sortOrder);
  };

  const handleClearAll = () => {
    setSearchTerm("");
    setAppliedMinScore("");
    setAppliedMaxScore("");
    setAppliedSortOrder("none");
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    appliedMinScore !== "" ||
    appliedMaxScore !== "" ||
    appliedSortOrder !== "none";

  const allCriteriaNames =
    assessments[0]?.scoreBreakdowns.map((breakdown) => breakdown.criterionName) || [];
  const criteriaColorMap = createCriteriaColorMap(allCriteriaNames);

  const filteredAndSortedAssessments = useMemo(() => {
    let filtered = assessments.filter((assessment) => {
      // Search by submission reference
      const matchesSearch =
        searchTerm === "" ||
        assessment.submissionReference.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by score range (using final score = rawScore * scaleFactor / 100)
      const finalScore = (assessment.rawScore * scaleFactor) / 100;
      const minScoreNum =
        appliedMinScore === "" ? -Infinity : parseFloat(appliedMinScore);
      const maxScoreNum = appliedMaxScore === "" ? Infinity : parseFloat(appliedMaxScore);
      const matchesScore = finalScore >= minScoreNum && finalScore <= maxScoreNum;

      return matchesSearch && matchesScore;
    });

    // Sort by final score
    if (appliedSortOrder !== "none") {
      filtered = [...filtered].sort((a, b) => {
        const aFinalScore = (a.rawScore * scaleFactor) / 100;
        const bFinalScore = (b.rawScore * scaleFactor) / 100;
        if (appliedSortOrder === "asc") {
          return aFinalScore - bFinalScore;
        } else {
          return bFinalScore - aFinalScore;
        }
      });
    }

    return filtered;
  }, [
    assessments,
    searchTerm,
    appliedMinScore,
    appliedMaxScore,
    appliedSortOrder,
    scaleFactor,
  ]);

  // Virtualization setup
  const virtualizer = useVirtualizer({
    count: filteredAndSortedAssessments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // Estimated height of each AssessmentResultCard + spacing
    overscan: 3, // Number of items to render outside the visible area for smooth scrolling
    measureElement:
      typeof ResizeObserver !== "undefined" ?
        (element) => element?.getBoundingClientRect().height
      : undefined,
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold">Grading Results</h2>

        <div className="flex gap-2 items-center">
          {/* Search - remains outside dropdown */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-48"
            />
          </div>

          {/* Filter and Sort Dropdown */}
          <FilterSortDropdown
            appliedMinScore={appliedMinScore}
            appliedMaxScore={appliedMaxScore}
            appliedSortOrder={appliedSortOrder}
            onApplyFilters={handleApplyFilters}
            onClearAll={handleClearAll}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </div>

      {filteredAndSortedAssessments.length === 0 ?
        <div className="text-center py-8 text-muted-foreground">
          {assessments.length === 0 ?
            "No assessments found for this grading session."
          : "No assessments match your search criteria."}
        </div>
      : <div
          ref={parentRef}
          className="h-[70vh] max-h-[800px] min-h-[400px] overflow-auto custom-scrollbar pr-1"
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
                <div className="py-2">
                  {/* Add padding around items */}
                  <AssessmentResultCard
                    key={
                      filteredAndSortedAssessments[virtualItem.index].id ||
                      virtualItem.index
                    }
                    item={filteredAndSortedAssessments[virtualItem.index]}
                    scaleFactor={scaleFactor}
                    criteriaColorMap={criteriaColorMap}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    </section>
  );
});

export default ReviewResults;
