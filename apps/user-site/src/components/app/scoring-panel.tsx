import React, { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Assessment, FeedbackItem } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { ScoreAdjustmentDialog } from "@/components/app/score-adjustment-dialog";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getScoreAdjustmentsQueryOptions } from "@/queries/assessment-queries";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ScoringPanelProps {
  rubric: Rubric;
  grading: GradingAttempt;
  assessment: Assessment;
  activeScoringTab: string;
  setActiveScoringTab: (tab: string) => void;
  onUpdate: (updatedAssessment: Partial<Assessment>) => void;
}

export const ScoringPanel: React.FC<ScoringPanelProps> = ({
  rubric,
  grading,
  assessment,
  activeScoringTab,
  setActiveScoringTab,
  onUpdate,
}) => {
  const auth = useAuth();
  const addFeedback = useCallback(
    (feedback: FeedbackItem) => {
      const currentFeedbacks = assessment.feedbacks || [];
      onUpdate({ feedbacks: [...currentFeedbacks, feedback] });
    },
    [assessment.feedbacks, onUpdate],
  );

  const updateFeedback = useCallback(
    (index: number, feedback: Partial<FeedbackItem>) => {
      const currentFeedbacks = assessment.feedbacks || [];
      if (index !== -1) {
        const updated = [...currentFeedbacks];
        updated[index] = { ...updated[index], ...feedback };
        onUpdate({ feedbacks: updated });
      }
    },
    [assessment.feedbacks, onUpdate],
  );

  const [editingSummaryIndex, setEditingSummaryIndex] = useState<number | null>(null);
  const [editingSummaryComment, setEditingSummaryComment] = useState("");
  const [addingSummary, setAddingSummary] = useState<string | null>(null);
  const [showScoreAdjustmentDialog, setShowScoreAdjustmentDialog] = useState(false);

  const { data: scoreAdjustments, isFetching } = useQuery(
    getScoreAdjustmentsQueryOptions(assessment.id, auth, {
      enabled: showScoreAdjustmentDialog,
      staleTime: Infinity,
    }),
  );

  const scale = grading.scaleFactor ?? 10;

  const handleUpdateScore = useCallback(
    (criterion: Rubric["criteria"][number], value: number, isActualScore: boolean) => {
      let rawScore: number;
      if (isActualScore) {
        rawScore = (value * 100) / scale;
      } else {
        rawScore = (value * (criterion.weight ?? 0)) / 100;
      }
      let matchedLevel;
      if (isActualScore) {
        matchedLevel = criterion.levels
          .filter((l) => {
            const levelRaw = (l.weight * (criterion.weight ?? 0)) / 100;
            const levelActual = (levelRaw * scale) / 100;
            return levelActual <= value;
          })
          .sort((a, b) => b.weight - a.weight)[0];
      } else {
        matchedLevel = criterion.levels
          .filter((l) => l.weight <= value)
          .sort((a, b) => b.weight - a.weight)[0];
      }
      if (!matchedLevel && criterion.levels.length > 0) {
        matchedLevel = criterion.levels.reduce(
          (min, l) => (l.weight < min.weight ? l : min),
          criterion.levels[0],
        );
      }
      const updated = (assessment.scoreBreakdowns || []).map((sb: any) =>
        sb.criterionName === criterion.name ?
          {
            ...sb,
            rawScore,
            performanceTag: matchedLevel ? matchedLevel.tag : "",
          }
        : sb,
      );
      console.log("Updated scoreBreakdowns:", updated);
      onUpdate({ scoreBreakdowns: updated });
    },
    [assessment.scoreBreakdowns, onUpdate, scale],
  );

  const totalScore = (
    ((assessment.scoreBreakdowns || []).reduce((acc, sb) => acc + sb.rawScore, 0) *
      scale) /
    100
  ).toFixed(2);

  return (
    <div className="px-4 flex flex-col bg-background w-full h-full overflow-hidden">
      <div className="flex flex-col flex-1">
        <Tabs
          value={activeScoringTab}
          onValueChange={setActiveScoringTab}
          className="flex-1 flex flex-col"
        >
          <div className="sticky top-0 bg-background flex flex-wrap md:flex-row items-center justify-between py-2">
            <TabsList>
              {rubric.criteria.map((criterion, index) => (
                <TabsTrigger key={index} className="text-xs" value={criterion.name}>
                  {criterion.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Total Score:</span>
                <span className="text-sm font-bold text-blue-600">{totalScore}</span>
                <span className="text-sm font-bold">/ {scale}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScoreAdjustmentDialog(true)}
                className="flex items-center gap-2"
                disabled={isFetching}
              >
                <History className="h-4 w-4" />
                <span className="text-xs">
                  {isFetching ? "Loading..." : "Score History"}
                </span>
              </Button>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            {rubric.criteria.map((criterion, index) => {
              if (activeScoringTab !== criterion.name) return null;

              const currentRawScore = (assessment.scoreBreakdowns || []).find(
                (sb) => sb.criterionName === criterion.name,
              );
              const rawScore = currentRawScore?.rawScore || 0;
              const criterionMaxPoints = (scale * (criterion.weight ?? 0)) / 100;
              const actualScore = Number(((rawScore * scale) / 100).toFixed(2));

              const summaryFbIndex = assessment.feedbacks?.findIndex(
                (f) => f.tag === "summary" && f.criterion === criterion.name,
              );
              const summaryFb =
                summaryFbIndex !== undefined && summaryFbIndex !== -1 ?
                  assessment.feedbacks[summaryFbIndex]
                : undefined;

              const handleEditSummary = () => {
                if (summaryFbIndex === undefined || summaryFbIndex === -1) return;
                setEditingSummaryIndex(summaryFbIndex);
                setEditingSummaryComment(summaryFb?.comment ?? "");
              };

              const handleSaveSummary = () => {
                if (editingSummaryIndex === null || !editingSummaryComment.trim()) return;
                updateFeedback(editingSummaryIndex, {
                  comment: editingSummaryComment,
                });
                setEditingSummaryIndex(null);
              };

              const handleAddSummary = () => {
                setAddingSummary("");
              };

              const handleSaveAddSummary = () => {
                if (!addingSummary || !addingSummary.trim()) return;
                addFeedback({
                  criterion: criterion.name,
                  fileRef: "",
                  comment: addingSummary.trim(),
                  tag: "summary",
                  locationData: {},
                } as FeedbackItem);
                setAddingSummary(null);
              };

              return (
                <TabsContent
                  key={index}
                  value={criterion.name}
                  className="flex-1 min-h-0 overflow-y-auto"
                >
                  <div className="rounded-md border p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="flex gap-3 items-center font-semibold text-sm">
                        {criterion.name} ({criterion.weight})%
                      </span>

                      <span className="text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-xs">Score:</span>
                          <Input
                            type="number"
                            min={0}
                            max={criterionMaxPoints}
                            step={0.5}
                            value={actualScore}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              const maxPoints = criterionMaxPoints;
                              if (isNaN(val) || e.target.value === "") {
                                handleUpdateScore(criterion, 0, true);
                                return;
                              }
                              const clamped = Math.max(0, Math.min(val, maxPoints));
                              handleUpdateScore(criterion, clamped, true);
                            }}
                            className="!text-xs w-17 h-8"
                          />
                          <span className="text-xs">/ {criterionMaxPoints} points</span>
                        </div>
                      </span>
                    </div>
                    {summaryFb ?
                      <div className="text-xs font-medium flex items-center gap-2">
                        {editingSummaryIndex === summaryFbIndex ?
                          <>
                            <Input
                              className="!text-xs h-8"
                              value={editingSummaryComment}
                              onChange={(e) => setEditingSummaryComment(e.target.value)}
                            />
                            <Button
                              className="border-none text-blue-500 hover:text-blue-500 underline text-xs"
                              variant={"outline"}
                              onClick={handleSaveSummary}
                              disabled={!editingSummaryComment.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              className=" border-none text-gray-500 underline text-xs"
                              variant={"outline"}
                              onClick={() => setEditingSummaryIndex(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        : <>
                            <span className="text-xs">Summary: {summaryFb.comment}</span>
                            <Button
                              className="border-none text-blue-500 hover:text-blue-500 underline text-xs"
                              variant={"outline"}
                              onClick={handleEditSummary}
                            >
                              Edit
                            </Button>
                          </>
                        }
                      </div>
                    : <div className="text-xs font-medium flex items-center gap-2">
                        {addingSummary !== null ?
                          <>
                            <Input
                              value={addingSummary}
                              onChange={(e) => setAddingSummary(e.target.value)}
                              placeholder="Input summary feedback..."
                              className="h-8"
                            />
                            <Button
                              size="sm"
                              className="text-sm"
                              variant="outline"
                              onClick={handleSaveAddSummary}
                              disabled={!addingSummary.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              className="text-sm"
                              size="sm"
                              variant="destructive"
                              onClick={() => setAddingSummary(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        : <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-500 underline text-sm"
                            onClick={handleAddSummary}
                          >
                            + Add summary feedback
                          </Button>
                        }
                      </div>
                    }
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {criterion.levels
                        .slice()
                        .sort((a, b) => a.weight - b.weight)
                        .map((level, idx) => {
                          const breakdown = (assessment.scoreBreakdowns || []).find(
                            (sb) => sb.criterionName === criterion.name,
                          );
                          const isSelected =
                            breakdown &&
                            breakdown.performanceTag === level.tag &&
                            breakdown.criterionName === criterion.name;
                          return (
                            <div key={idx} className="grid grid-rows-[auto_1fr] h-full">
                              <div className="text-center">
                                <span className="text-xs text-gray-400">
                                  {level.weight}%
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  handleUpdateScore(criterion, level.weight, false)
                                }
                                className={cn(
                                  `w-full h-20 p-3 rounded text-center flex items-center justify-center`,
                                  isSelected ?
                                    "border-2 border-blue-400"
                                  : "border border-gray-300",
                                )}
                              >
                                <div
                                  className={cn(
                                    "text-xs leading-tight",
                                    isSelected && "font-semibold",
                                  )}
                                >
                                  {level.description}
                                </div>
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </div>
        </Tabs>
      </div>
      <ScoreAdjustmentDialog
        scaleFactor={scale}
        open={showScoreAdjustmentDialog}
        onOpenChange={setShowScoreAdjustmentDialog}
        scoreAdjustment={scoreAdjustments || []}
      />
    </div>
  );
};
