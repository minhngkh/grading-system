import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getTagColor } from "./icon-utils";
import { Assessment, FeedbackItem } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";

interface ScoringPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeScoringTab: string;
  setActiveScoringTab: (tab: string) => void;
  rubric: Rubric;
  grading: GradingAttempt;
  formData: Assessment;
  isResizing: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  updateScore: (criterionName: string, newScore: number) => void;
  addFeedback?: (feedback: FeedbackItem) => void;
  updateFeedback?: (index: number, updatedFeedback: Partial<FeedbackItem>) => void;
  feedbacks?: FeedbackItem[];
}

export const ScoringPanel: React.FC<ScoringPanelProps> = ({
  activeTab,
  setActiveTab,
  activeScoringTab,
  setActiveScoringTab,
  rubric,
  grading,
  formData,
  isResizing,
  handleMouseDown,
  updateScore,
  addFeedback,
  updateFeedback,
  feedbacks,
}) => {
  // const tests: TestCase[] = [
  //   { input: "1\n2\n3\n", expectedOutput: "6\n", actualOutput: "6\n", status: "pass" },
  //   { input: "5\n10\n", expectedOutput: "15\n", actualOutput: "", status: "pending" },
  //   { input: "4 5\n", expectedOutput: "20\n", actualOutput: "19\n", status: "fail" },
  //   {
  //     input: "100\n200\n300\n",
  //     expectedOutput: "600\n",
  //     actualOutput: "600\n",
  //     status: "pass",
  //   },
  //   { input: "-1\n1\n", expectedOutput: "0\n", actualOutput: "0\n", status: "pass" },
  //   { input: "0\n0\n0\n", expectedOutput: "0\n", actualOutput: "0\n", status: "pass" },
  //   { input: "a b\n", expectedOutput: "error\n", actualOutput: "", status: "pending" },
  //   {
  //     input: "999999\n1\n",
  //     expectedOutput: "1000000\n",
  //     actualOutput: "",
  //     status: "pending",
  //   },
  //   {
  //     input: "3\n-3\n3\n-3\n",
  //     expectedOutput: "0\n",
  //     actualOutput: "0\n",
  //     status: "fail",
  //   },
  //   {
  //     input: "123456789\n987654321\n",
  //     expectedOutput: "1111111110\n",
  //     actualOutput: "",
  //     status: "pending",
  //   },
  // ];

  // Tính điểm giống bên index
  const calcScore = (rawScore: number, weight: number) => {
    const scale = grading.scaleFactor ?? 10;
    return ((rawScore / weight) * (weight * scale)) / 100;
  };

  // State for editing summary feedback comment inline
  const [editingSummaryIdx, setEditingSummaryIdx] = useState<number | null>(null);
  const [editingSummaryComment, setEditingSummaryComment] = useState("");
  const [addingSummary, setAddingSummary] = useState<string | null>(null);

  return (
    <div className="flex flex-col bg-background w-full h-full overflow-hidden">
      <div
        className={`h-1 hover:bg-blue-400 cursor-ns-resize transition-colors duration-200 ${
          isResizing ? "bg-blue-500" : ""
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="h-full flex items-center justify-center">
          <div className="w-12 h-0.5 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      <div className="flex flex-col">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v || "")}
          className="flex-1 flex flex-col"
        >
          <div className="p-2 flex-shrink-0">
            <TabsList className=" w-full h-auto rounded-lg">
              <TabsTrigger value="scoring">Rubric Scoring</TabsTrigger>
              <TabsTrigger value="summary">Score Summary</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="scoring" className="flex-1 overflow-auto px-4 pb-4">
            <Tabs
              value={activeScoringTab}
              onValueChange={(v) => setActiveScoringTab(v || "")}
              className="flex-1 flex flex-col"
            >
              <TabsList className="flex flex-wrap gap-1 p-1 rounded-lg">
                {rubric.criteria.map((criterion) => (
                  <TabsTrigger
                    key={criterion.id}
                    value={criterion.name}
                    className="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
                  >
                    {criterion.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {rubric.criteria.map((criterion) => {
                if (activeScoringTab !== criterion.name) return null;
                const currentRawScore = formData.scoreBreakdowns.find(
                  (sb) => sb.criterionName === criterion.name,
                );
                const scale = grading.scaleFactor ?? 10;
                const rawScore = currentRawScore?.rawScore || 0;
                const criterionMaxPoints =
                  ((grading.scaleFactor ?? 10) * (criterion.weight ?? 0)) / 100;
                // Tính điểm giống bên index
                const points = calcScore(rawScore, criterion.weight ?? 0);

                // Tìm summary feedback cho criterion này
                const summaryFb = feedbacks?.find(
                  (f) => f.tag === "summary" && f.criterion === criterion.name,
                );
                const summaryFbIdx = feedbacks?.findIndex(
                  (f) => f.tag === "summary" && f.criterion === criterion.name,
                );

                const handleEditSummary = () => {
                  if (!summaryFb || summaryFbIdx === undefined || summaryFbIdx < 0)
                    return;
                  setEditingSummaryIdx(summaryFbIdx);
                  setEditingSummaryComment(summaryFb.comment);
                };
                const handleSaveSummary = () => {
                  if (
                    editingSummaryIdx === null ||
                    !updateFeedback ||
                    !editingSummaryComment.trim()
                  )
                    return;
                  updateFeedback(editingSummaryIdx, {
                    comment: editingSummaryComment,
                  });
                  setEditingSummaryIdx(null);
                };

                // Thêm summary feedback mới
                const handleAddSummary = () => {
                  setAddingSummary("");
                };
                const handleSaveAddSummary = () => {
                  if (!addFeedback || !addingSummary || !addingSummary.trim()) return;
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
                    key={criterion.id}
                    value={criterion.name}
                    className="flex-1"
                  >
                    <div className="rounded-lg border p-4 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
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
                                  weight > 0 ?
                                    ((clamped * 100) / scale / weight) * 100
                                  : 0;
                                console.log(
                                  `Updating score for ${criterion.name}: rawScore=${newRaw}, points=${clamped}, weight=${weight}, scale=${scale}`,
                                );
                                updateScore(criterion.name, newRaw);
                              }}
                              className="w-20 rounded border border-gray-600 px-2 py-1 text-sm"
                            />
                            <span className="text-xs">/ {criterionMaxPoints} points</span>
                          </div>
                        </span>
                      </div>
                      {/* Hiển thị hoặc thêm summary feedback */}
                      {summaryFb ?
                        <div className="text-xs font-medium flex items-center gap-2">
                          {editingSummaryIdx === summaryFbIdx ?
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
                                onClick={() => setEditingSummaryIdx(null)}
                              >
                                Cancel
                              </button>
                            </>
                          : <>
                              <span>Summary: {summaryFb.comment}</span>
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
                      <div className="flex gap-4">
                        {criterion.levels
                          .slice()
                          .sort((a, b) => a.weight - b.weight)
                          .map((level) => (
                            <div key={level.tag} className="flex-1">
                              <div className="text-center mb-2">
                                <span className="text-xs text-gray-400">
                                  {level.weight}%
                                </span>
                              </div>
                              <button
                                onClick={() => updateScore(criterion.name, level.weight)}
                                className={`w-full p-3 rounded text-center ${
                                  (
                                    rawScore ===
                                    (level.weight * (criterion.weight ?? 0)) / 100
                                  ) ?
                                    "border-2 border-blue-400"
                                  : "border"
                                }`}
                              >
                                <div className="text-xs">{level.description}</div>
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </TabsContent>
          <TabsContent value="summary" className="flex-1 overflow-auto px-4 pb-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Score Summary</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rubric.criteria.map((criterion) => {
                  const currentScore = formData.scoreBreakdowns.find(
                    (sb) => sb.criterionName === criterion.name,
                  );
                  const weight = criterion.weight ?? 0;
                  const score =
                    currentScore ? calcScore(currentScore.rawScore, weight) : 0;
                  return (
                    <div key={criterion.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{criterion.name}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getTagColor(currentScore?.performanceTag || "")}`}
                          >
                            {currentScore?.performanceTag || "N/A"}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">
                          {score.toFixed(2)}/
                          {(
                            ((grading.scaleFactor ?? 10) * (criterion.weight || 0)) /
                            100
                          ).toFixed(2)}
                        </span>
                      </div>
                      <Progress
                        value={
                          currentScore?.rawScore ?
                            (currentScore.rawScore / (criterion.weight ?? 1)) * 100
                          : 0
                        }
                        className="h-2.5"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
