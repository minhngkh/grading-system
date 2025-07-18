import React, { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Assessment, FeedbackItem } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { ScoreAdjustmentDialog } from "@/components/app/score-adjustment-dialog";
import { useAuth } from "@clerk/clerk-react";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { getScoreAdjustmentsQueryOptions } from "@/queries/assessment-queries";

interface ScoringPanelProps {
  rubric: Rubric;
  grading: GradingAttempt;
  formData: Assessment;
  updateScore: (criterionName: string, newScore: number) => void;
  assessmentId: string;
  activeScoringTab: string;
  setActiveScoringTab: (tab: string) => void;
  form: UseFormReturn<Assessment>;
}

export const ScoringPanel: React.FC<ScoringPanelProps> = ({
  rubric,
  grading,
  formData,
  updateScore,
  assessmentId,
  activeScoringTab,
  setActiveScoringTab,
  form,
}) => {
  const auth = useAuth();

  const generateUID = useCallback(() => {
    const first = (Math.random() * 46656) | 0;
    const second = (Math.random() * 46656) | 0;
    const part1 = ("000" + first.toString(36)).slice(-3);
    const part2 = ("000" + second.toString(36)).slice(-3);
    return (part1 + part2).toUpperCase();
  }, []);

  // Helper functions for feedback operations (no toast - direct form updates)
  const addFeedbackDirect = useCallback(
    (feedback: FeedbackItem) => {
      try {
        const feedbackWithId = { ...feedback, id: feedback.id || generateUID() };
        const currentFeedbacks = form.getValues("feedbacks") || [];
        form.setValue("feedbacks", [...currentFeedbacks, feedbackWithId], {
          shouldValidate: false,
        });
      } catch (error) {
        console.error("Error adding feedback:", error);
      }
    },
    [form, generateUID],
  );

  const updateFeedbackDirect = useCallback(
    (feedbackId: string, feedback: Partial<FeedbackItem>) => {
      try {
        const currentFeedbacks = form.getValues("feedbacks") || [];
        const index = currentFeedbacks.findIndex((f) => f.id === feedbackId);

        if (index !== -1) {
          const updated = [...currentFeedbacks];
          updated[index] = { ...updated[index], ...feedback };
          form.setValue("feedbacks", updated, { shouldValidate: false });
        }
      } catch (error) {
        console.error("Error updating feedback:", error);
      }
    },
    [form],
  );

  // Internal state - component manages its own dialogs
  const [editingSummaryId, setEditingSummaryId] = useState<string | null>(null);
  const [editingSummaryComment, setEditingSummaryComment] = useState("");
  const [addingSummary, setAddingSummary] = useState<string | null>(null);
  const [showScoreAdjustmentDialog, setShowScoreAdjustmentDialog] = useState(false);

  // Internal feedback operations using direct form updates
  const addFeedback = (feedback: FeedbackItem) => {
    const feedbackWithId = { ...feedback, id: generateUID() };
    // Add feedback directly without toast
    addFeedbackDirect(feedbackWithId);
  };

  const updateFeedback = (feedbackId: string, updatedFeedback: Partial<FeedbackItem>) => {
    // Update feedback directly without toast
    updateFeedbackDirect(feedbackId, updatedFeedback);
  };

  // Use mutation for score adjustment fetching
  const { data: scoreAdjustments, isFetching } = useQuery(
    getScoreAdjustmentsQueryOptions(assessmentId, auth, {
      enabled: showScoreAdjustmentDialog,
      staleTime: Infinity,
    }),
  );

  const calcScore = (rawScore: number, weight: number) => {
    const scale = grading.scaleFactor ?? 10;
    return ((rawScore / weight) * (weight * scale)) / 100;
  };

  const totalScore = (
    (formData.scoreBreakdowns.reduce((acc, sb) => acc + sb.rawScore, 0) *
      (grading.scaleFactor ?? 10)) /
    100
  ).toFixed(2);

  return (
    <div className="flex flex-col bg-background w-full h-full overflow-hidden">
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
                <span className="text-sm font-bold">/ {grading.scaleFactor}</span>
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

              // Use formData instead of form.getValues for real-time data
              const currentRawScore = formData.scoreBreakdowns.find(
                (sb) => sb.criterionName === criterion.name,
              );
              const scale = grading.scaleFactor ?? 10;
              const rawScore = currentRawScore?.rawScore || 0;
              const criterionMaxPoints =
                ((grading.scaleFactor ?? 10) * (criterion.weight ?? 0)) / 100;
              const points = calcScore(rawScore, criterion.weight ?? 0);

              // Use formData for feedbacks too
              const summaryFb = formData.feedbacks?.find(
                (f) => f.tag === "summary" && f.criterion === criterion.name,
              );

              const handleEditSummary = () => {
                if (!summaryFb || !summaryFb.id) return;
                setEditingSummaryId(summaryFb.id);
                setEditingSummaryComment(summaryFb.comment);
              };

              const handleSaveSummary = () => {
                if (!editingSummaryId || !editingSummaryComment.trim()) return;
                updateFeedback(editingSummaryId, {
                  comment: editingSummaryComment,
                });
                setEditingSummaryId(null);
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
                            value={
                              points !== undefined && points !== null ?
                                Number(points.toFixed(2))
                              : ""
                            }
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              const maxPoints = criterionMaxPoints;
                              if (isNaN(val) || e.target.value === "") {
                                updateScore(criterion.name, 0);
                                return;
                              }
                              const clamped = Math.max(0, Math.min(val, maxPoints));
                              const weight = criterion.weight ?? 0;
                              // rawScore = (points * weight) / scale * 100
                              const newRaw =
                                weight > 0 ? ((clamped * 100) / scale / weight) * 100 : 0;
                              updateScore(criterion.name, newRaw);
                            }}
                            className="w-20 rounded border border-gray-600 px-2 py-1 text-xs font-semibold"
                          />
                          <span className="text-xs">/ {criterionMaxPoints} points</span>
                        </div>
                      </span>
                    </div>
                    {/* Hiển thị hoặc thêm summary feedback */}
                    {summaryFb ?
                      <div className="text-xs font-medium flex items-center gap-2">
                        {editingSummaryId === summaryFb.id ?
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
                              onClick={() => setEditingSummaryId(null)}
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
                        .map((level, index) => {
                          // So sánh tag và criterionName để border blue
                          const breakdown = formData.scoreBreakdowns.find(
                            (sb) => sb.criterionName === criterion.name,
                          );
                          const isSelected =
                            breakdown &&
                            breakdown.performanceTag === level.tag &&
                            breakdown.criterionName === criterion.name;
                          return (
                            <div key={index} className="grid grid-rows-[auto_1fr] h-full">
                              <div className="text-center">
                                <span className="text-xs text-gray-400">
                                  {level.weight}%
                                </span>
                              </div>
                              <button
                                onClick={() => updateScore(criterion.name, level.weight)}
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

      {/* Score Adjustment Dialog - managed internally */}
      <ScoreAdjustmentDialog
        scaleFactor={grading.scaleFactor ?? 10}
        open={showScoreAdjustmentDialog}
        onOpenChange={setShowScoreAdjustmentDialog}
        scoreAdjustment={scoreAdjustments || []}
      />
    </div>
  );
};
