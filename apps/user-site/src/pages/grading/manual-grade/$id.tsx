import { useEffect, useState } from "react";
import { Feedback, GradingResult, Submission } from "@/types/submission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";
import AssignmentViewer from "./assignment-viewer";
import { Rubric } from "@/types/rubric";
// import { updateGradingResult, updateSubmission } from "@/services/submissionService";
import { LoadingScreen } from "@/components/loading-screen";
interface ManualAdjustScorePageProps {
  initSubmission: Submission;
  initGradingResult: GradingResult;
  initRubric: Rubric;
}

export default function ManualAdjustScorePage({
  initSubmission,
  initGradingResult,
  initRubric,
}: ManualAdjustScorePageProps) {
  const [submission, setSubmission] = useState(initSubmission);
  const [gradingResult, setGradingResult] = useState(initGradingResult || {});
  const [criteria, setCriteria] = useState(initRubric.criteria || []);
  const [activeScoreTab, setActiveScoreTab] = useState(criteria[0]?.id || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initSubmission || !initGradingResult || !initRubric) {
      setError("Missing required data");
      return;
    }
    setError(null);
  }, [initSubmission, initGradingResult, initRubric]);

  const currentScore = gradingResult.criterionResults.reduce(
    (total, criterionResult) => total + criterionResult.score,
    0,
  );
  const maxScore =
    criteria.reduce((total, criteria) => total + 10 * (criteria.weight ?? 0), 0) || 0;

  const handleUpdateFeedback = (criterionId: string, feedbacks: Feedback[]) => {
    setGradingResult((prev) => ({
      ...prev,
      criterionResults: prev.criterionResults.map((criterionResult) =>
        criterionResult.criterionId === criterionId
          ? { ...criterionResult, feedback: feedbacks }
          : criterionResult,
      ),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!gradingResult.criterionResults.every((cr) => cr.score >= 0)) {
        throw new Error("Invalid scores detected");
      }

      console.log("Submission and GradingResult updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit grading");
      console.error("Failed to update Submission and GradingResult:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !submission || !gradingResult || !initRubric) {
    return <LoadingScreen />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="w-full flex flex-col px-4">
      <div className="relative w-3/4 mx-auto mb-2 flex">
        <Badge className="w-full text-sm" variant="outline">
          {submission.id}
        </Badge>
      </div>

      <div className="w-full">
        <AssignmentViewer
          breakdowns={submission?.breakdowns || []}
          gradingResult={gradingResult}
          setGradingResult={setGradingResult}
          testCases={[]}
          updateFeedback={(criterionId, breakdownId, comment) => {
            const criterionResult = gradingResult.criterionResults.find(
              (result) => result.criterionId === criterionId,
            );

            if (!criterionResult) return;

            const updatedFeedbacks = criterionResult.feedback.map((fb) =>
              fb.id === breakdownId ? { ...fb, comment } : fb,
            );

            handleUpdateFeedback(criterionId, updatedFeedbacks);
          }}
        />

        <div className="flex flex-col">
          <Tabs value={activeScoreTab} onValueChange={setActiveScoreTab} className="mt-2">
            <TabsList className="flex border-b w-full dark:border-gray-700">
              {gradingResult.criterionResults.map((criteriaResult) => {
                const maxPoints =
                  criteria.find((c) => c.id === criteriaResult.criterionId)?.weight || 0;

                return (
                  <TabsTrigger
                    key={criteriaResult.criterionId}
                    value={criteriaResult.criterionId}
                    className="flex-1 flex justify-between pl-4 pr-7 cursor-pointer"
                  >
                    <div className="font-bold">
                      {criteria.find((c) => c.id === criteriaResult.criterionId)?.name ||
                        "Unknown"}
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <input
                        type="number"
                        value={criteriaResult.score}
                        min={0}
                        max={maxPoints}
                        step={0.5}
                        onChange={(e) => {
                          let newScore = parseFloat(e.target.value) || 0;
                          if (newScore < 0) newScore = 0;
                          if (newScore > maxPoints) newScore = maxPoints;
                          setGradingResult((prev) => ({
                            ...prev,
                            criterionResults: prev.criterionResults.map((cr) =>
                              cr.criterionId === criteriaResult.criterionId
                                ? { ...cr, score: newScore }
                                : cr,
                            ),
                          }));
                        }}
                        className="w-12 text-center border rounded px-1 dark:bg-gray-800 dark:text-gray-300"
                      />
                      / {maxPoints}
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {gradingResult.criterionResults.map((criteriaResult) => {
              const criterion = criteria.find((c) => c.id === criteriaResult.criterionId);
              if (!criterion) return null;

              return (
                <TabsContent
                  key={criteriaResult.criterionId}
                  value={criteriaResult.criterionId}
                >
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${criterion.levels.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {criterion.levels.map((level) => (
                      <Button
                        key={level.weight}
                        onClick={() =>
                          setGradingResult((prev) => ({
                            ...prev,
                            criterionResults: prev.criterionResults.map((cr) =>
                              cr.criterionId === criteriaResult.criterionId
                                ? { ...cr, score: level.weight }
                                : cr,
                            ),
                          }))
                        }
                        variant="outline"
                        className={`p-5 flex flex-col items-start rounded-md text-left w-full h-[70px] cursor-pointer transition-colors relative ${
                          criteriaResult.score === level.weight
                            ? "bg-[#D4E3FC] hover:bg-[#D4E3FC] dark:bg-[#2D3748] dark:hover:bg-[#2D3748]"
                            : "bg-[#EAF1F6] hover:bg-[#D4E3FC] dark:bg-[#1A202C] dark:hover:bg-[#2D3748]"
                        }`}
                      >
                        <div className="font-bold whitespace-nowrap flex justify-between w-full">
                          <span>
                            {level.weight} - {level.tag}
                          </span>
                          <span className="w-6 h-6 flex-shrink-0">
                            {criteriaResult.score === level.weight && (
                              <Check className="text-blue-500 dark:text-blue-300" />
                            )}
                          </span>
                        </div>
                        <div className="text-sm text-wrap break-words leading-snug dark:text-gray-400">
                          {level.description}
                        </div>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>

          <div className="flex items-stretch w-full h-full border rounded-lg mt-2 dark:border-gray-700">
            <Button
              className="bg-black text-white px-6 py-2 rounded-r-none cursor-pointer dark:bg-gray-800 dark:text-gray-300"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
            <div className="flex-1 text-right pr-4 font-medium flex items-center justify-end dark:text-gray-300">
              {currentScore}
            </div>
            <div className="bg-gray-200 rounded-r-lg flex items-center px-4 dark:bg-gray-700">
              <span className="text-sm font-medium dark:text-gray-300">
                {currentScore} / {maxScore}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
