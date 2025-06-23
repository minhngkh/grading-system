import { Assessment } from "@/types/assessment";
import { createCriteriaColorMap } from "./colors";
import { memo } from "react";
import { AssessmentResultCard } from "@/pages/grading/grading-result/result-card";

interface ReviewResultsProps {
  assessments: Assessment[];
  scaleFactor: number;
}

const ReviewResults = memo(function ReviewResults({
  assessments,
  scaleFactor,
}: ReviewResultsProps) {
  const allCriteriaNames =
    assessments[0]?.scoreBreakdowns.map((breakdown) => breakdown.criterionName) || [];
  const criteriaColorMap = createCriteriaColorMap(allCriteriaNames);

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Grading Results</h2>
      {assessments.length === 0 ?
        <div>No assessments found for this grading session.</div>
      : <div className="space-y-4">
          {assessments.map((item, index) => (
            <AssessmentResultCard
              key={index}
              item={item}
              scaleFactor={scaleFactor}
              criteriaColorMap={criteriaColorMap}
            />
          ))}
        </div>
      }
    </section>
  );
});

export default ReviewResults;
