import type { Assessment, FeedbackItem } from "@/types/assessment";
import type { GradingAttempt } from "@/types/grading";
import type { Rubric } from "@/types/rubric";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { History, Info } from "lucide-react";
import React, { useCallback, useState } from "react";
import { PluginMetadataDialog } from "@/components/app/plugin-metadata";
import { ScoreAdjustmentDialog } from "@/components/app/score-adjustment-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getScoreAdjustmentsQueryOptions } from "@/queries/assessment-queries";

interface ScoringPanelProps {
  rubric: Rubric;
  grading: GradingAttempt;
  assessment: Assessment;
  activeScoringTab: string;
  setActiveScoringTab: (tab: string) => void;
  onUpdate: (updatedAssessment: Partial<Assessment>) => void;
}

function getInsertIndex(arr: number[], target: number): number {
  if (arr.length === 0) return 0;

  const isAscending = arr[0] < arr[arr.length - 1];
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (isAscending) {
      if (arr[mid] < target) {
        left = mid + 1;
      } else {
        right = mid;
      }
    } else {
      if (arr[mid] > target) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
  }

  return left;
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
  const [pluginMetadataOpen, setPluginMetadataOpen] = useState(false);
  const [selectedCriterion, setSelectedCriterion] = useState<{
    name: string;
    pluginType: string;
    metadata: unknown;
  } | null>(null);

  // Helper function to determine plugin type from metadata
  const getPluginType = (
    metadata?: string[] | Record<string, unknown>,
  ): string | null => {
    if (!metadata) return null;

    // Handle if metadata is already an object
    if (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)) {
      return (metadata as any).plugin || null;
    }

    // Handle if metadata is an array of strings, try parsing the first item
    if (Array.isArray(metadata) && metadata.length > 0) {
      try {
        const parsed = JSON.parse(metadata[0]);
        return parsed.plugin || null;
      } catch {
        return null;
      }
    }

    return null;
  };

  // Helper function to check if metadata exists and is valid
  const hasValidMetadata = (metadata?: string[] | Record<string, unknown>): boolean => {
    if (!metadata) return false;

    // Handle if metadata is already an object
    if (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)) {
      return Object.keys(metadata).length > 0 && (metadata as any).plugin;
    }

    // Handle if metadata is an array of strings
    if (Array.isArray(metadata) && metadata.length > 0) {
      try {
        const parsed = JSON.parse(metadata[0]);
        return parsed.plugin && Object.keys(parsed).length > 0;
      } catch {
        return false;
      }
    }

    return false;
  };

  // Helper function to parse metadata
  const parseMetadata = (metadata?: string[] | Record<string, unknown>): unknown => {
    if (!metadata) return null;

    // If metadata is already an object, return it directly
    if (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)) {
      return metadata;
    }

    // If metadata is an array, try to parse the first item as JSON
    if (Array.isArray(metadata) && metadata.length > 0) {
      try {
        return JSON.parse(metadata[0]);
      } catch {
        return metadata;
      }
    }

    return metadata;
  };

  const handleShowMetadata = (
    criterionName: string,
    metadata?: string[] | Record<string, unknown>,
  ) => {
    const pluginType = getPluginType(metadata);
    if (!pluginType) return;

    const parsedMetadata = parseMetadata(metadata);
    if (!parsedMetadata) return;

    setSelectedCriterion({
      name: criterionName,
      pluginType,
      metadata: parsedMetadata,
    });
    setPluginMetadataOpen(true);
  };

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
    <div className="px-4 flex flex-col bg-background w-full h-full">
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
                <TabsContent key={index} value={criterion.name} className="flex-1">
                  <div className="rounded-md border p-4 flex flex-col gap-2 overflow-auto custom-scrollbar">
                    <div className="flex items-center justify-between">
                      <span className="flex gap-3 items-center font-semibold text-sm">
                        {criterion.name} ({criterion.weight})%
                        {(() => {
                          const scoreBreakdown = (assessment.scoreBreakdowns || []).find(
                            (sb) => sb.criterionName === criterion.name,
                          );
                          const pluginType =
                            scoreBreakdown ?
                              getPluginType(scoreBreakdown.metadata)
                            : null;
                          const hasMetadata =
                            scoreBreakdown &&
                            pluginType &&
                            hasValidMetadata(scoreBreakdown.metadata);

                          return hasMetadata ?
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() =>
                                  scoreBreakdown &&
                                  handleShowMetadata(
                                    criterion.name,
                                    scoreBreakdown.metadata,
                                  )
                                }
                                title={`View ${pluginType} results`}
                              >
                                <Info className="h-3 w-3" />
                              </Button>
                            : null;
                        })()}
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
                              const val = Number.parseFloat(e.target.value);
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
                    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
                      {criterion.levels
                        .slice()
                        .sort((a, b) => a.weight - b.weight)
                        .map((level, idx) => {
                          const breakdown = (assessment.scoreBreakdowns || []).find(
                            (sb) => sb.criterionName === criterion.name,
                          );

                          const isSelected =
                            (breakdown?.performanceTag === level.tag ||
                              getInsertIndex(
                                criterion.levels.map((l) => l.weight),
                                breakdown?.rawScore || 0,
                              ) === idx) &&
                            breakdown?.criterionName === criterion.name;
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
                                  `w-full h-auto p-3 rounded text-center flex items-center justify-center`,
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
      {selectedCriterion && (
        <PluginMetadataDialog
          open={pluginMetadataOpen}
          onOpenChange={setPluginMetadataOpen}
          pluginType={selectedCriterion.pluginType}
          metadata={selectedCriterion.metadata}
          criterionName={selectedCriterion.name}
        />
      )}
    </div>
  );
};
