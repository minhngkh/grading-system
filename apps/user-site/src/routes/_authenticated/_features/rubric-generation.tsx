import RubricGenerationPage from "@/pages/features/rubric-generation";
import { createRubric, getRubric } from "@/services/rubricService";
import { createFileRoute } from "@tanstack/react-router";

const itemIdentifier = "rubric-gen";

export const Route = createFileRoute(
  "/_authenticated/_features/rubric-generation"
)({
  component: RoutePage,
  loader: async () => {
    try {
      let curRubricId = sessionStorage.getItem(itemIdentifier);
      if (!curRubricId) {
        curRubricId = await createRubric();
        sessionStorage.setItem(itemIdentifier, curRubricId);
      }

      return await getRubric(curRubricId);
    } catch (err) {
      const mockRubric = {
        id: "rubric-123",
        rubricName: "Essay Writing Rubric",
        performanceTags: [
          "Excellent",
          "Good",
          "Satisfactory",
          "Needs Improvement",
        ],
        criteria: [
          {
            name: "Thesis Statement",
            totalCriterionPoints: 10,
            levels: [
              {
                description: "Clear and well-defined thesis",
                points: 10,
                performanceTag: "Excellent",
              },
              {
                description: "Mostly clear thesis",
                points: 8,
                performanceTag: "Good",
              },
              {
                description: "Basic or unclear thesis",
                points: 5,
                performanceTag: "Satisfactory",
              },
              {
                description: "No clear thesis",
                points: 2,
                performanceTag: "Needs Improvement",
              },
            ],
          },
          {
            name: "Organization",
            totalCriterionPoints: 10,
            levels: [
              {
                description: "Logical and well-structured",
                points: 10,
                performanceTag: "Excellent",
              },
              {
                description: "Mostly organized",
                points: 8,
                performanceTag: "Good",
              },
              {
                description: "Somewhat disorganized",
                points: 5,
                performanceTag: "Satisfactory",
              },
              {
                description: "Lacks clear structure",
                points: 2,
                performanceTag: "Needs Improvement",
              },
            ],
          },
          {
            name: "Grammar and Mechanics",
            totalCriterionPoints: 10,
            levels: [
              {
                description: "Few or no errors",
                points: 10,
                performanceTag: "Excellent",
              },
              {
                description: "Some minor errors",
                points: 8,
                performanceTag: "Good",
              },
              {
                description: "Noticeable errors",
                points: 5,
                performanceTag: "Satisfactory",
              },
              {
                description: "Frequent and distracting errors",
                points: 2,
                performanceTag: "Needs Improvement",
              },
            ],
          },
        ],
        updatedOn: new Date(),
        status: "completed",
      };
      return mockRubric;
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
  const rubric = Route.useLoaderData();
  return <RubricGenerationPage initialRubric={rubric} />;
}
