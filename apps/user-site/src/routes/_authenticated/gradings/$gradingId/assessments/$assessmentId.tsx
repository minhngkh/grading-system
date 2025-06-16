import ErrorComponent from "@/components/app/route-error";
import PendingComponent from "@/components/app/route-pending";
import { RubricAssessmentUI } from "@/pages/review/manual-grade";
import { AssessmentService } from "@/services/assessment-service";
import { GradingService } from "@/services/grading-service";
import { RubricService } from "@/services/rubric-service";
import { Assessment } from "@/types/assessment";
import { Rubric, RubricStatus } from "@/types/rubric";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/gradings/$gradingId/assessments/$assessmentId",
)({
  component: RouteComponent,
  loader: async ({ params: { gradingId, assessmentId } }) => {
    // const mockAssessment: Assessment = {
    //   id: "assess-123",
    //   gradingId: "grading-456",
    //   submissionReference: "grading-f1f3510a-a32b-08dd-a590-5564b6e427ce",
    //   rawScore: 87,
    //   adjustedCount: 1,
    //   scoreBreakdowns: [
    //     {
    //       id: "sb-1",
    //       criterionName: "Code Structure",
    //       tag: "Good",
    //       rawScore: 70, // 70% of 25 (weight) = 17.5
    //     },
    //     {
    //       id: "sb-2",
    //       criterionName: "Readability",
    //       tag: "Excellent",
    //       rawScore: 100, // 100% of 25 (weight) = 25
    //     },
    //     {
    //       id: "sb-3",
    //       criterionName: "Correctness",
    //       tag: "Good",
    //       rawScore: 70, // 70% of 30 (weight) = 21
    //     },
    //     {
    //       id: "sb-4",
    //       criterionName: "Documentation",
    //       tag: "Fair",
    //       rawScore: 60, // 60% of 20 (weight) = 12
    //     },
    //   ],
    //   feedbacks: [
    //     // 📝 PDF feedback (page-based highlight)
    //     {
    //       id: "fb-1",
    //       criterion: "Code Structure",
    //       fileRef: "pdf-test.pdf",
    //       page: 1,
    //       x: 100,
    //       y: 150,
    //       width: 200,
    //       height: 50,
    //       comment: "Consider modularizing this block for better readability.",
    //       tag: "notice",
    //     },
    //     {
    //       id: "fb-2",
    //       criterion: "Readability",
    //       fileRef: "pdf-test.pdf",
    //       page: 2,
    //       x: 50,
    //       y: 80,
    //       width: 180,
    //       height: 40,
    //       comment: "Naming could be more descriptive.",
    //       tag: "tip",
    //     },

    //     // 🖼️ Image feedback (no page)
    //     {
    //       id: "fb-3",
    //       criterion: "Correctness",
    //       fileRef: "jkl.jpg",
    //       x: 20,
    //       y: 30,
    //       width: 40,
    //       height: 40,
    //       comment: "Function doesn’t handle edge cases properly.",
    //       tag: "caution",
    //     },
    //     {
    //       id: "fb-4",
    //       criterion: "Documentation",
    //       fileRef: "jkl.jpg",
    //       x: 10,
    //       y: 20,
    //       width: 80,
    //       height: 30,
    //       comment: "Add more explanation about setup instructions.123",
    //       tag: "info",
    //     },

    //     // 🧾 Text feedback
    //     {
    //       id: "fb-5",
    //       type: "text",
    //       criterion: "Documentation",
    //       fileRef: "Untitled.cpp",
    //       fromLine: 0,
    //       toLine: 1,
    //       fromCol: 0,
    //       toCol: 3,
    //       comment: "Add more explanation about setup instructions.456",
    //       tag: "info",
    //     },
    //     {
    //       id: "fb-6",
    //       criterion: "Documentation",
    //       fileRef: "bde.txt",
    //       fromLine: 0,
    //       toLine: 1,
    //       fromCol: 0,
    //       toCol: 3,
    //       comment: "Add more explanation about setup instructions.789",
    //       tag: "info",
    //     },
    //   ],
    // };

    // const mockRubric: Rubric = {
    //   id: "rubric-001",
    //   rubricName: "Code Quality Rubric",
    //   tags: ["Excellent", "Good", "Fair", "Poor"],
    //   criteria: [
    //     {
    //       id: "crit-1",
    //       name: "Code Structure",
    //       weight: 25,
    //       levels: [
    //         { description: "Well-organized, modular", weight: 100, tag: "Excellent" },
    //         { description: "Mostly organized", weight: 70, tag: "Good" },
    //         { description: "Unclear structure", weight: 40, tag: "Fair" },
    //         { description: "Poor structure", weight: 10, tag: "Poor" },
    //       ],
    //     },
    //     {
    //       id: "crit-2",
    //       name: "Readability",
    //       weight: 25,
    //       levels: [
    //         { description: "Clear, concise code", weight: 100, tag: "Excellent" },
    //         { description: "Minor readability issues", weight: 75, tag: "Good" },
    //         { description: "Difficult to read", weight: 50, tag: "Fair" },
    //         { description: "Unreadable", weight: 25, tag: "Poor" },
    //       ],
    //     },
    //     {
    //       id: "crit-3",
    //       name: "Correctness",
    //       weight: 30,
    //       levels: [
    //         { description: "Fully correct", weight: 100, tag: "Excellent" },
    //         { description: "Minor bugs", weight: 70, tag: "Good" },
    //         { description: "Some functionality missing", weight: 40, tag: "Fair" },
    //       ],
    //     },
    //     {
    //       id: "crit-4",
    //       name: "Documentation",
    //       weight: 20,
    //       levels: [
    //         { description: "Well documented", weight: 100, tag: "Excellent" },
    //         { description: "Partial docs", weight: 60, tag: "Fair" },
    //         { description: "No documentation", weight: 30, tag: "Poor" },
    //       ],
    //     },
    //   ],
    //   updatedOn: new Date(),
    //   status: RubricStatus.Used,
    // };
    const assessment = await AssessmentService.getAssessmentById(assessmentId);
    const grading = await GradingService.getGradingAttempt(gradingId);
    const scaleFactor = grading.scaleFactor || 1;
    if (!grading.rubricId) {
      throw new Error("Rubric ID is missing from grading.");
    }
    const rubric = await RubricService.getRubric(grading.rubricId);
    return { assessment, scaleFactor, rubric };
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent("Loading assessment..."),
});

function RouteComponent() {
  const { assessment, scaleFactor, rubric } = Route.useLoaderData();
  return (
    <RubricAssessmentUI
      assessment={assessment}
      scaleFactor={scaleFactor}
      rubric={rubric}
    />
  );
}
