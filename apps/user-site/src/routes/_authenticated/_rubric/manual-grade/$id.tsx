import ManualAdjustScorePage from "@/pages/features/manual-grade/$id";
import { GradingResult, Submission } from "@/types/submission";
import { getRubric } from "@/services/rubricService";
// import { getGradingResult, getSubmission } from "@/services/submissionService";
import { createFileRoute } from "@tanstack/react-router";
import { Rubric } from "@/types/rubric";

export const Route = createFileRoute("/_authenticated/_features/manual-grade/$id")({
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

      const submission = {
        id: submissionId,
        submittedBy: "mock-user-123",
        submissionTimestamp: new Date().toISOString(),
        rubricId: "mock-rubric-id-123",
        gradingStatus: "COMPLETED",
        breakdowns: [
          {
            id: "mock-breakdown-id-1",
            type: "essay",
            processedContent: `Protecting The Environment
Protecting the environment has never been more urgent than it is today. As global populations rise and industrial activities expand, the strain on our planet’s natural systems intensifies. From the air we breathe to the water we drink, each element of our environment is interconnected, and damage in one area can ripple through the entire ecosystem. By recognizing these connections, we can begin to adopt practices that reduce pollution, conserve resources, and preserve biodiversity.

One of the most impactful actions individuals can take is reducing waste. Single-use plastics—such as water bottles, straws, and shopping bags—often end up in landfills or oceans, taking centuries to decompose. Choosing reusable alternatives, recycling whenever possible, and composting organic scraps not only cuts down on landfill volume but also conserves the energy and raw materials required to manufacture new products. Simple habits—like carrying a refillable water bottle or bringing your own cloth bag to the grocery store—collectively make a significant difference.`,
            criterionId: "mock-criterion-id-1",
            adjustmentCount: 1,
            fileReference: "file1.txt",
            score: {
              submissionBreakDownId: "mock-breakdown-id-1",
              pointsAwarded: 7.5,
              comments: "Good structure but needs more clarity.",
              gradedBy: "mock-grader-1",
              source: "HUMAN",
              updatedAt: new Date().toISOString(),
            },
          },
          {
            id: "mock-breakdown-id-2",
            type: "essay",
            processedContent: "Mock processed content for Criterion 2",
            criterionId: "mock-criterion-id-2",
            adjustmentCount: 2,
            target: "Paragraph 1",
            fileReference: "file2.txt",
            score: {
              submissionBreakDownId: "mock-breakdown-id-2",
              pointsAwarded: 6.0,
              comments: "Argument is somewhat weak, consider strengthening it.",
              gradedBy: "mock-grader-2",
              source: "HUMAN",
              updatedAt: new Date().toISOString(),
            },
          },
          {
            id: "mock-breakdown-id-3",
            type: "code",
            processedContent: "Mock processed content for Criterion 3",
            criterionId: "mock-criterion-id-3",
            adjustmentCount: 0,
            target: "Paragraph 2",
            fileReference: "file3.txt",
            score: {
              submissionBreakDownId: "mock-breakdown-id-3",
              pointsAwarded: 8.0,
              comments: "Excellent vocabulary usage throughout the essay.",
              gradedBy: "mock-grader-3",
              source: "HUMAN",
              updatedAt: new Date().toISOString(),
            },
          },
          {
            id: "mock-breakdown-id-4",
            type: "code",
            processedContent: `function quickSort(arr) {
    if (arr.length <= 1) return arr;
    const pivot = arr[arr.length - 1];
    const left = [], right = [];
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] < pivot) left.push(arr[i]);
      else right.push(arr[i]);
    }
    return [...quickSort(left), pivot, ...quickSort(right)];
  }`,
            criterionId: "mock-criterion-id-4",
            adjustmentCount: 3,
            fileReference: "fibonacci.cpp",
            score: {
              submissionBreakDownId: "mock-breakdown-id-4",
              pointsAwarded: 5.5,
              comments: "Grammar mistakes are affecting readability.",
              gradedBy: "mock-grader-4",
              source: "HUMAN",
              updatedAt: new Date().toISOString(),
            },
          },
        ],
      };

      const gradingResult = {
        id: "mock-grading-result-id-123",
        submissionId,
        rubricId: "mock-rubric-id-123",
        gradingStatus: "COMPLETED",
        criterionResults: [
          {
            id: "mock-criterion-result-id-1",
            gradingResultId: "mock-grading-result-id-123",
            criterionId: "mock-criterion-id-1",
            score: 7.5,
            feedback: [
              {
                id: "feedback-1",
                DocumentLocation: {
                  id: "loc-1",
                  fromLine: 1,
                  toLine: 1,
                  fromCol: 1,
                  toCol: 10,
                },
                comment: "Good structure in introduction.",
                tag: "info" as const,
              },
            ],
          },
          {
            id: "mock-criterion-result-id-2",
            gradingResultId: "mock-grading-result-id-123",
            criterionId: "mock-criterion-id-2",
            score: 6.0,
            feedback: [
              {
                id: "feedback-2",
                DocumentLocation: {
                  id: "loc-2",
                  fromLine: 4,
                  toLine: 6,
                  fromCol: 10,
                  toCol: 60,
                },
                comment: "Argument needs more support.",
              },
            ],
          },
          {
            id: "mock-criterion-result-id-3",
            gradingResultId: "mock-grading-result-id-123",
            criterionId: "mock-criterion-id-3",
            score: 8.0,
            feedback: [
              {
                id: "feedback-3",
                DocumentLocation: {
                  id: "loc-3",
                  fromLine: 7,
                  toLine: 9,
                  fromCol: 1,
                  toCol: 40,
                },
                comment: "Excellent vocabulary range.",
              },
            ],
          },
          {
            id: "mock-criterion-result-id-4",
            gradingResultId: "mock-grading-result-id-123",
            criterionId: "mock-criterion-id-4",
            score: 5.5,
            feedback: [
              {
                id: "feedback-4",
                DocumentLocation: {
                  id: "loc-4",
                  fromLine: 5,
                  toLine: 6,
                  fromCol: 0,
                  toCol: 20,
                },
                comment: "Several grammar errors found.",
                tag: "caution" as const,
              },
            ],
          },
        ],
      };

      const rubric = {
        id: "mock-rubric-id-123",
        rubricName: "Mock Rubric for Testing",
        performanceTags: ["Excellent", "Good", "Average", "Poor"],
        criteria: [
          {
            id: "mock-criterion-id-1",
            name: "Organization",
            totalCriterionPoints: 10,
            levels: [
              {
                description: "Excellent organization",
                points: 10,
                performanceTag: "Excellent",
              },
              { description: "Good organization", points: 8, performanceTag: "Good" },
              { description: "Fair organization", points: 6, performanceTag: "Average" },
            ],
          },
          {
            id: "mock-criterion-id-2",
            name: "Content",
            totalCriterionPoints: 10,
            levels: [
              {
                description: "Highly relevant and detailed content",
                points: 10,
                performanceTag: "Excellent",
              },
              {
                description: "Relevant content with some details",
                points: 7,
                performanceTag: "Good",
              },
              {
                description: "Basic content with limited detail",
                points: 5,
                performanceTag: "Average",
              },
            ],
          },
          {
            id: "mock-criterion-id-3",
            name: "Vocabulary",
            totalCriterionPoints: 10,
            levels: [
              {
                description: "Wide range of vocabulary",
                points: 10,
                performanceTag: "Excellent",
              },
              {
                description: "Adequate range of vocabulary",
                points: 7,
                performanceTag: "Good",
              },
              {
                description: "Limited range of vocabulary",
                points: 5,
                performanceTag: "Average",
              },
            ],
          },
          {
            id: "mock-criterion-id-4",
            name: "Grammar",
            totalCriterionPoints: 10,
            levels: [
              {
                description: "Virtually no errors",
                points: 10,
                performanceTag: "Excellent",
              },
              { description: "Few minor errors", points: 7, performanceTag: "Good" },
              { description: "Several errors", points: 5, performanceTag: "Average" },
            ],
          },
        ],
        updatedOn: new Date(),
        status: "ACTIVE",
      };
      return {
        submission,
        gradingResult,
        rubric,
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

interface LoaderData {
  submission: Submission;
  gradingResult: GradingResult;
  rubric: Rubric;
}

function RoutePage() {
  const { submission, gradingResult, rubric } = Route.useLoaderData() as LoaderData;

  return (
    <ManualAdjustScorePage
      initSubmission={submission}
      initGradingResult={gradingResult}
      initRubric={rubric}
    />
  );
}
