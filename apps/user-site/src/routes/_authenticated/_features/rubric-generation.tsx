import RubricGenerationPage from "@/pages/features/rubric-generation";
import { createRubric, getRubric } from "@/services/rubricService";
import { createFileRoute } from "@tanstack/react-router";

const itemIdentifier = "rubric-gen";

export const Route = createFileRoute("/_authenticated/_features/rubric-generation")({
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
        tags: ["Excellent", "Good", "Satisfactory", "Needs Improvement"],
        criteria: [
          {
            name: "Thesis Statement",
            weight: 10,
            levels: [
              {
                description: "Clear and well-defined thesis",
                weight: 10,
                tag: "Excellent",
              },
              {
                description: "Mostly clear thesis",
                weight: 8,
                tag: "Good",
              },
              {
                description: "Basic or unclear thesis",
                weight: 5,
                tag: "Satisfactory",
              },
              {
                description: "No clear thesis",
                weight: 2,
                tag: "Needs Improvement",
              },
            ],
          },
          {
            name: "Organization",
            weight: 10,
            levels: [
              {
                description: "Logical and well-structured",
                weight: 10,
                tag: "Excellent",
              },
              {
                description: "Mostly organized",
                weight: 8,
                tag: "Good",
              },
              {
                description: "Somewhat disorganized",
                weight: 5,
                tag: "Satisfactory",
              },
              {
                description: "Lacks clear structure",
                weight: 2,
                tag: "Needs Improvement",
              },
            ],
          },
          {
            name: "Grammar and Mechanics",
            weight: 10,
            levels: [
              {
                description: "Few or no errors",
                weight: 10,
                tag: "Excellent",
              },
              {
                description: "Some minor errors",
                weight: 8,
                tag: "Good",
              },
              {
                description: "Noticeable errors",
                weight: 5,
                tag: "Satisfactory",
              },
              {
                description: "Frequent and distracting errors",
                weight: 2,
                tag: "Needs Improvement",
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
