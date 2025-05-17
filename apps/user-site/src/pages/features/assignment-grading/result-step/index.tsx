import { useEffect, useState } from "react";
import { GradingAttempt } from "@/types/grading";
import { Assessment } from "@/types/assessment";
import SummarySection from "./summary-section";
import ReviewResults from "./review-results";

const mockAssessments: Assessment[] = [
  {
    id: "1",
    gradingId: "grade1",
    scaleFactor: 1,
    submissionReference: "assignment1.pdf",
    rawScore: 0.85,
    adjustedCount: 0,
    scoreBreakdowns: [
      { criterionName: "Content", tag: "content", rawScore: 0.9 },
      { criterionName: "Structure", tag: "structure", rawScore: 0.8 },
      { criterionName: "Clarity", tag: "clarity", rawScore: 0.85 },
      { criterionName: "Analysis", tag: "analysis", rawScore: 0.82 },
      { criterionName: "References", tag: "references", rawScore: 0.88 },
    ],
    feedbacks: [
      {
        criterion: "Content",
        fileRef: "assignment1.pdf",
        fromLine: 1,
        toLine: 5,
        fromCol: 0,
        toCol: 80,
        comment: "Well-structured introduction",
        tag: "positive",
      },
    ],
  },
  {
    id: "2",
    gradingId: "grade1",
    scaleFactor: 1,
    submissionReference: "project_report.docx",
    rawScore: 0.92,
    adjustedCount: 0,
    scoreBreakdowns: [
      { criterionName: "Content", tag: "content", rawScore: 0.95 },
      { criterionName: "Structure", tag: "structure", rawScore: 0.9 },
      { criterionName: "Clarity", tag: "clarity", rawScore: 0.92 },
      { criterionName: "Analysis", tag: "analysis", rawScore: 0.94 },
      { criterionName: "References", tag: "references", rawScore: 0.89 },
    ],
    feedbacks: [],
  },
  {
    id: "3",
    gradingId: "grade1",
    scaleFactor: 1,
    submissionReference: "final_essay.pdf",
    rawScore: 0.78,
    adjustedCount: 0,
    scoreBreakdowns: [
      { criterionName: "Content", tag: "content", rawScore: 0.75 },
      { criterionName: "Structure", tag: "structure", rawScore: 0.8 },
      { criterionName: "Clarity", tag: "clarity", rawScore: 0.78 },
      { criterionName: "Analysis", tag: "analysis", rawScore: 0.76 },
      { criterionName: "References", tag: "references", rawScore: 0.81 },
    ],
    feedbacks: [],
  },
];

type ResultsStepProps = {
  gradingAttempt: GradingAttempt;
};

export default function ResultsStep({ gradingAttempt }: ResultsStepProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mappedAssessments = assessments.map((assessment) => ({
    id: assessment.id,
    fileName: assessment.submissionReference,
    totalPercentage: Math.round((assessment.rawScore || 0) * assessment.scaleFactor),
    criteria: assessment.scoreBreakdowns.map((breakdown) => ({
      name: breakdown.criterionName,
      percentage: Math.round(breakdown.rawScore * assessment.scaleFactor),
    })),
  }));

  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      // Simulate API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setAssessments(mockAssessments);

      // Real API call (commented for now)
      // const assessments = await getGradingAssessments(gradingAttempt.id);
      // setAssessments(assessments);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <SummarySection
        isLoading={isLoading}
        assessments={assessments}
        mappedAssessments={mappedAssessments}
      />

      {/* List Section */}
      <ReviewResults isLoading={isLoading} mappedAssessments={mappedAssessments} />
    </div>
  );
}
