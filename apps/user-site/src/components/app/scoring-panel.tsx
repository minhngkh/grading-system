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
import useAssessmentForm from "@/hooks/use-assessment-form";

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
  const { form, formData } = useAssessmentForm(assessment);

  const addFeedback = useCallback(
    (feedback: FeedbackItem) => {
      const currentFeedbacks = formData.feedbacks || [];
      onUpdate({ feedbacks: [...currentFeedbacks, feedback] });
    },
    [formData.feedbacks, onUpdate],
  );

  const updateFeedback = useCallback(
    (index: number, feedback: Partial<FeedbackItem>) => {
      const currentFeedbacks = formData.feedbacks || [];
      if (index !== -1) {
        const updated = [...currentFeedbacks];
        updated[index] = { ...updated[index], ...feedback };
        onUpdate({ feedbacks: updated });
      }
    },
    [formData.feedbacks, onUpdate],
  );

  const [editingSummaryIndex, setEditingSummaryIndex] = useState<number | null>(null);
  const [editingSummaryComment, setEditingSummaryComment] = useState("");
  const [addingSummary, setAddingSummary] = useState<string | null>(null);
  const [showScoreAdjustmentDialog, setShowScoreAdjustmentDialog] = useState(false);

  const { data: scoreAdjustments, isFetching } = useQuery(
    getScoreAdjustmentsQueryOptions(formData.id, auth, {
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
      const updated = (formData.scoreBreakdowns || []).map((sb: any) =>
        sb.criterionName === criterion.name ?
          {
            ...sb,
            rawScore,
            performanceTag: matchedLevel ? matchedLevel.tag : "",
          }
        : sb,
      );
      form.setValue("scoreBreakdowns", updated, { shouldValidate: true });
      onUpdate({ scoreBreakdowns: updated });
    },
    [form, formData.scoreBreakdowns, onUpdate, scale],
  );

  const totalScore = (
    ((formData.scoreBreakdowns || []).reduce((acc, sb) => acc + sb.rawScore, 0) * scale) /
    100
  ).toFixed(2);

  return (
    <div className="p-4 flex flex-col bg-background w-full h-full overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0">
        <Tabs
          value={activeScoringTab}
          onValueChange={setActiveScoringTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex-shrink-0 sticky top-0 bg-background flex items-center justify-between py-2">
            <TabsList className="flex flex-wrap gap-1 py-1 rounded-lg">
              {rubric.criteria.map((criterion, index) => (
                <TabsTrigger
                  key={index}
                  value={criterion.name}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
                >
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
          <div className="flex-1 min-h-0 flex flex-col">
            {rubric.criteria.map((criterion, index) => {
              if (activeScoringTab !== criterion.name) return null;

              const currentRawScore = (formData.scoreBreakdowns || []).find(
                (sb) => sb.criterionName === criterion.name,
              );
              const rawScore = currentRawScore?.rawScore || 0;
              const criterionMaxPoints = (scale * (criterion.weight ?? 0)) / 100;
              const actualScore = Number(((rawScore * scale) / 100).toFixed(2));

              const summaryFbIndex = formData.feedbacks?.findIndex(
                (f) => f.tag === "summary" && f.criterion === criterion.name,
              );
              const summaryFb =
                summaryFbIndex !== undefined && summaryFbIndex !== -1 ?
                  formData.feedbacks[summaryFbIndex]
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
                  className="flex-1 min-h-0 overflow-auto"
                >
                  <div className="rounded-lg border p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs flex gap-3 items-center font-medium text-muted-foreground">
                        {criterion.name} - {criterion.weight}%
                      </span>
                      <span className="text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">Custom Score:</span>
                          <input
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
                            className="w-20 rounded border border-gray-600 px-2 py-1 text-xs font-semibold"
                          />
                          <span className="text-xs">/ {criterionMaxPoints} points</span>
                        </div>
                      </span>
                    </div>
                    {summaryFb ?
                      <div className="text-xs font-medium flex items-center gap-2">
                        {editingSummaryIndex === summaryFbIndex ?
                          <>
                            <input
                              className="border rounded px-2 py-1 text-xs w-full"
                              value={editingSummaryComment}
                              onChange={(e) => setEditingSummaryComment(e.target.value)}
                            />
                            <button
                              className="text-blue-500 underline text-xs"
                              type="button"
                              onClick={handleSaveSummary}
                              disabled={!editingSummaryComment.trim()}
                            >
                              Save
                            </button>
                            <button
                              className="text-gray-500 underline text-xs"
                              type="button"
                              onClick={() => setEditingSummaryIndex(null)}
                            >
                              Cancel
                            </button>
                          </>
                        : <>
                            <span className="text-xs">Summary: {summaryFb.comment}</span>
                            <button
                              className="text-blue-500 underline text-xs"
                              type="button"
                              onClick={handleEditSummary}
                            >
                              Edit
                            </button>
                          </>
                        }
                      </div>
                    : <div className="text-xs font-medium flex items-center gap-2">
                        {addingSummary !== null ?
                          <>
                            <input
                              className="border rounded px-2 py-1 text-xs w-full"
                              value={addingSummary}
                              onChange={(e) => setAddingSummary(e.target.value)}
                              placeholder="Add summary feedback..."
                            />
                            <button
                              className="text-blue-500 underline text-xs"
                              type="button"
                              onClick={handleSaveAddSummary}
                              disabled={!addingSummary.trim()}
                            >
                              Save
                            </button>
                            <button
                              className="text-gray-500 underline text-xs"
                              type="button"
                              onClick={() => setAddingSummary(null)}
                            >
                              Cancel
                            </button>
                          </>
                        : <button
                            className="text-blue-500 underline text-xs"
                            type="button"
                            onClick={handleAddSummary}
                          >
                            + Add summary feedback
                          </button>
                        }
                      </div>
                    }
                    <div className="grid auto-cols-auto grid-flow-col gap-4">
                      {criterion.levels
                        .slice()
                        .sort((a, b) => a.weight - b.weight)
                        .map((level, idx) => {
                          const breakdown = (formData.scoreBreakdowns || []).find(
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
                                className={`w-full h-20 p-3 rounded text-center flex items-center justify-center ${
                                  isSelected ?
                                    "border-2 border-blue-400"
                                  : "border border-gray-300"
                                }`}
                              >
                                <div className="text-xs leading-tight">
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
