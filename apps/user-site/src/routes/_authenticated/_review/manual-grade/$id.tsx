import ManualAdjustScorePage from "@/pages/review/manual-grade/$id";
import { GradingResult, Submission } from "@/types/submission";
import { getRubric } from "@/services/rubric-service";
// import { getGradingResult, getSubmission } from "@/services/submissionService";
import { createFileRoute } from "@tanstack/react-router";
import { Rubric, RubricStatus } from "@/types/rubric";
import { Assessment } from "@/types/assessment";

export const Route = createFileRoute("/_authenticated/_review/manual-grade/$id")({
  component: RoutePage,
  loader: async ({ params }) => {
    const submissionId = params.id;
    if (!submissionId) {
      throw new Error("Submission ID is required");
    }

    try {
      // const submission = await getSubmission(submissionId);
      // const gradingResult = await getGradingResult(submissionId);
      // const rubric = await getRubric(submission.rubricId);
      // return { submission, gradingResult, rubric };

      const mockAssessment: Assessment = {
        id: "assessment-001",
        gradingId: "grading-12345",
        scaleFactor: 1.0,
        submissionReference: "submission-abc.txt",
        rawScore: 6.5,
        adjustedCount: 2,
        scoreBreakdowns: [
          { criterionName: "Task Response", tag: "info", rawScore: 6.0 },
          { criterionName: "Coherence and Cohesion", tag: "notice", rawScore: 6.5 },
          { criterionName: "Lexical Resource", tag: "tip", rawScore: 7.0 },
          {
            criterionName: "Grammatical Range and Accuracy",
            tag: "caution",
            rawScore: 6.0,
          },
        ],
        feedbacks: [
          {
            criterion: "Task Response",
            fileRef: "submission-abc.txt",
            fromLine: 2,
            toLine: 2,
            fromCol: 5,
            toCol: 40,
            comment: "Main idea is vague, consider specifying your position.",
            tag: "info",
          },
          {
            criterion: "Coherence and Cohesion",
            fileRef: "submission-def.txt",
            fromLine: 4,
            toLine: 5,
            fromCol: 0,
            toCol: 70,
            comment: "Paragraph lacks clear transition; add linking words.",
            tag: "notice",
          },
          {
            criterion: "Lexical Resource",
            fileRef: "submission-adb.txt",
            fromLine: 6,
            toLine: 6,
            fromCol: 15,
            toCol: 55,
            comment: "Repetitive vocabulary — consider using synonyms.",
            tag: "tip",
          },
          {
            criterion: "Grammatical Range and Accuracy",
            fileRef: "submission-ưqe.txt",
            fromLine: 8,
            toLine: 8,
            fromCol: 0,
            toCol: 30,
            comment: "Incorrect tense usage here.",
            tag: "caution",
          },
          {
            criterion: "Task Response",
            fileRef: "submission-abc.txt",
            fromLine: 10,
            toLine: 11,
            fromCol: 10,
            toCol: 70,
            comment: "Argument presented without supporting evidence.",
            tag: "info",
          },
          {
            criterion: "Lexical Resource",
            fileRef: "submission-abc.txt",
            fromLine: 12,
            toLine: 12,
            fromCol: 5,
            toCol: 45,
            comment: "Nice use of advanced vocabulary here.",
            tag: "tip",
          },
          {
            criterion: "Grammatical Range and Accuracy",
            fileRef: "submission-abc.txt",
            fromLine: 13,
            toLine: 13,
            fromCol: 0,
            toCol: 60,
            comment: "Complex sentence structure used effectively.",
            tag: "caution",
          },
          {
            criterion: "Coherence and Cohesion",
            fileRef: "submission-abc.txt",
            fromLine: 14,
            toLine: 15,
            fromCol: 20,
            toCol: 80,
            comment: "This section flows well and is logically structured.",
            tag: "notice",
          },
        ],
      };
      const mockRubric: Rubric = {
        id: "rubric-001",
        rubricName: "IELTS Writing Task 2 Rubric",
        tags: ["info", "notice", "tip", "caution"],
        updatedOn: new Date(),
        status: RubricStatus.Used,
        criteria: [
          {
            id: "criterion-1",
            name: "Task Response",
            weight: 25,
            plugin: "clarityPlugin",
            levels: [
              {
                description: "Addresses all parts of the task effectively",
                weight: 100,
                tag: "info",
              },
            ],
          },
          {
            id: "criterion-2",
            name: "Coherence and Cohesion",
            weight: 25,
            plugin: "structurePlugin",
            levels: [
              {
                description: "Ideas are logically organized and well-connected",
                weight: 100,
                tag: "notice",
              },
            ],
          },
          {
            id: "criterion-3",
            name: "Lexical Resource",
            weight: 25,
            plugin: "vocabPlugin",
            levels: [
              {
                description: "Uses a wide range of vocabulary appropriately",
                weight: 100,
                tag: "tip",
              },
            ],
          },
          {
            id: "criterion-4",
            name: "Grammatical Range and Accuracy",
            weight: 25,
            plugin: "grammarPlugin",
            levels: [
              {
                description: "Uses complex sentence structures with few errors",
                weight: 100,
                tag: "caution",
              },
            ],
          },
        ],
      };
      return {
        assessment: mockAssessment,
        rubric: mockRubric,
      };
    } catch {
      // Handle error
    }
  },
  errorComponent: () => ErrorComponent(),
  pendingComponent: () => PendingComponent(),
});

function PendingComponent() {
  return (
    <div className="container flex size-full justify-center items-center">
      Setting up...
    </div>
  );
}

function ErrorComponent() {
  return (
    <div className="container flex size-full justify-center items-center">
      Service not available. Please try again later!
    </div>
  );
}

function RoutePage() {
  const loaderData = Route.useLoaderData();
  if (!loaderData) {
    return <div>Error: Data could not be loaded.</div>;
  }
  const { assessment, rubric } = loaderData;

  return <ManualAdjustScorePage initAssessment={assessment} initRubric={rubric} />;
}
