import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";
import AssignmentViewer from "./assignment-viewer";
import { Rubric } from "@/types/rubric";
import { LoadingScreen } from "@/components/app/loading-screen";
import { Assessment } from "@/types/assessment";
import ExportDialog from "./export-dialog";

interface ManualAdjustScorePageProps {
  initAssessment: Assessment;
  initRubric: Rubric;
}

export default function ManualAdjustScorePage({
  initAssessment,
  initRubric,
}: ManualAdjustScorePageProps) {
  const [assessment, setAssessment] = useState(initAssessment);
  const [criteria] = useState(initRubric.criteria || []);
  const [activeScoreTab, setActiveScoreTab] = useState(
    initAssessment.scoreBreakdowns[0]?.criterionName || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initAssessment || !initRubric) {
      setError("Missing required data");
      return;
    }
    setError(null);
  }, [initAssessment, initRubric]);

  const currentScore = assessment.rawScore || 0;
  const maxScore = criteria.reduce((total, c) => total + (c.weight ?? 0), 0) || 0;
  const percentScore = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;

  const handleScoreChange = (criterionName: string, levelWeight: number) => {
    const criterion = criteria.find((c) => c.name === criterionName);
    if (!criterion) return;
    const criterionWeight = criterion.weight ?? 0;
    const newScore = Math.round((levelWeight / 100) * criterionWeight * 100) / 100;
    const tag = criterion.levels.find((l) => l.weight === levelWeight)?.tag || "";
    setAssessment((prev) => ({
      ...prev,
      scoreBreakdowns: prev.scoreBreakdowns.map((b) =>
        b.criterionName === criterionName ? { ...b, rawScore: newScore, tag } : b,
      ),
      rawScore: prev.scoreBreakdowns
        .map((b) => (b.criterionName === criterionName ? newScore : b.rawScore))
        .reduce((sum, s) => sum + s, 0),
    }));
  };

  const handleInputScoreChange = (criterionName: string, inputScore: number) => {
    const criterion = criteria.find((c) => c.name === criterionName);
    if (!criterion || !criterion.weight) return;
    let newScore =
      isNaN(inputScore) ? 0 : Math.max(0, Math.min(inputScore, criterion.weight));
    let closestLevel = criterion.levels[0];
    let minDiff = Math.abs(newScore - (closestLevel.weight / 100) * criterion.weight);
    for (const level of criterion.levels) {
      const levelScore = (level.weight / 100) * criterion.weight;
      const diff = Math.abs(newScore - levelScore);
      if (diff < minDiff) {
        minDiff = diff;
        closestLevel = level;
      }
    }
    setAssessment((prev) => ({
      ...prev,
      scoreBreakdowns: prev.scoreBreakdowns.map((b) =>
        b.criterionName === criterionName ?
          { ...b, rawScore: newScore, tag: closestLevel.tag }
        : b,
      ),
      rawScore: prev.scoreBreakdowns
        .map((b) => (b.criterionName === criterionName ? newScore : b.rawScore))
        .reduce((sum, s) => sum + s, 0),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!assessment.scoreBreakdowns.every((b) => b.rawScore >= 0)) {
        throw new Error("Invalid scores detected");
      }
      // Submit logic here (call API or update backend)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!initAssessment || !initRubric) return <LoadingScreen />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="w-full flex flex-col px-4">
      <div className="flex items-center justify-between mb-4 mx-2">
        <h1 className="text-lg font-semibold">{assessment.id}</h1>
        <ExportDialog assessmentData={assessment} />
      </div>
      <div className="w-full">
        <AssignmentViewer
          assessment={assessment}
          setAssessment={setAssessment}
          rubric={initRubric}
        />
        <div className="flex flex-col">
          <Tabs value={activeScoreTab} onValueChange={setActiveScoreTab} className="mt-2">
            <TabsList className="flex border-b w-full dark:border-gray-700">
              {assessment.scoreBreakdowns.map((breakdown) => {
                const criterion = criteria.find(
                  (c) => c.name === breakdown.criterionName,
                );
                const maxPoints = criterion?.weight ?? 0;
                return (
                  <TabsTrigger
                    key={breakdown.criterionName}
                    value={breakdown.criterionName}
                    className="flex-1 flex justify-between pl-4 pr-7 cursor-pointer"
                  >
                    <div className="font-bold">{breakdown.criterionName}</div>
                    <div className="text-sm flex items-center gap-2">
                      <input
                        type="number"
                        value={breakdown.rawScore}
                        min={0}
                        max={maxPoints}
                        step={0.5}
                        onChange={(e) =>
                          handleInputScoreChange(
                            breakdown.criterionName,
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-12 text-center border rounded px-1 dark:bg-gray-800 dark:text-gray-300"
                      />
                      / {maxPoints}
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {assessment.scoreBreakdowns.map((breakdown) => {
              const criterion = criteria.find((c) => c.name === breakdown.criterionName);
              if (!criterion) return null;
              return (
                <TabsContent
                  key={breakdown.criterionName}
                  value={breakdown.criterionName}
                >
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${criterion.levels.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {criterion.levels.map((level) => {
                      const levelScore =
                        Math.round((level.weight / 100) * (criterion.weight ?? 0) * 100) /
                        100;
                      return (
                        <Button
                          key={level.weight}
                          onClick={() =>
                            handleScoreChange(breakdown.criterionName, level.weight)
                          }
                          variant="outline"
                          className={`p-5 flex flex-col items-start rounded-md text-left w-full h-[70px] cursor-pointer transition-colors relative ${
                            breakdown.rawScore === levelScore ?
                              "bg-[#D4E3FC] hover:bg-[#D4E3FC] dark:bg-[#2D3748] dark:hover:bg-[#2D3748]"
                            : "bg-[#EAF1F6] hover:bg-[#D4E3FC] dark:bg-[#1A202C] dark:hover:bg-[#2D3748]"
                          }`}
                        >
                          <div className="font-bold whitespace-nowrap flex justify-between w-full">
                            <span>
                              {level.weight}% - {level.tag}
                            </span>
                            <span className="w-6 h-6 flex-shrink-0">
                              {breakdown.rawScore === levelScore && (
                                <Check className="text-blue-500 dark:text-blue-300" />
                              )}
                            </span>
                          </div>
                          <div className="text-sm text-wrap break-words leading-snug dark:text-gray-400">
                            {level.description}
                          </div>
                        </Button>
                      );
                    })}
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
            <div className="bg-gray-200 flex items-center px-4 dark:bg-gray-700">
              <span className="text-sm font-medium dark:text-gray-300">
                {currentScore} / {maxScore} ({percentScore}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
