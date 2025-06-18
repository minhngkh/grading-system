import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getTagColor } from "./icon-utils";
import { Assessment } from "@/types/assessment";
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
  bottomPanelHeight: number;
  isResizing: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  feedbackOverview: string;
  updateScore: (criterionName: string, newScore: number) => void;
}

export const ScoringPanel: React.FC<ScoringPanelProps> = ({
  activeTab,
  setActiveTab,
  activeScoringTab,
  setActiveScoringTab,
  rubric,
  grading,
  formData,
  bottomPanelHeight,
  isResizing,
  handleMouseDown,
  feedbackOverview,
  updateScore,
}) => {
  // Tính điểm giống bên index
  const calcScore = (rawScore: number, weight: number) => {
    const scale = grading.scaleFactor ?? 10;
    return ((rawScore / weight) * (weight * scale)) / 100;
  };

  return (
    <>
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
      <div
        className="border-t flex flex-col"
        style={{
          minHeight: 120,
          maxHeight: "100vh",
          height: bottomPanelHeight,
          flex: "0 0 auto",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v || "")}
          className="flex-1 flex flex-col"
        >
          <div className="p-4 flex-shrink-0">
            <TabsList className="inline-flex w-full h-auto items-center justify-center rounded-xl p-1 text-gray-500">
              <TabsTrigger value="scoring">Rubric Scoring</TabsTrigger>
              <TabsTrigger value="summary">Score Summary</TabsTrigger>
              <TabsTrigger value="tests">Test Results</TabsTrigger>
              <TabsTrigger value="overview">Feedback Overview</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="scoring" className="flex-1 overflow-auto px-4 pb-4">
            <Tabs
              value={activeScoringTab}
              onValueChange={(v) => setActiveScoringTab(v || "")}
              className="flex-1 flex flex-col"
            >
              <div className="px-4 py-2 flex-shrink-0">
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
              </div>
              {rubric.criteria.map((criterion) => {
                if (activeScoringTab !== criterion.name) return null;
                const currentRawScore = formData.scoreBreakdowns.find(
                  (sb) => sb.criterionName === criterion.name,
                );
                const scale = grading.scaleFactor ?? 10;
                const currentScore =
                  currentRawScore ? (currentRawScore.rawScore * scale) / 100 : 0;
                const rawScore = currentRawScore?.rawScore || 0;
                const criterionMaxPoints =
                  ((grading.scaleFactor ?? 10) * (criterion.weight ?? 0)) / 100;
                // Tính điểm giống bên index
                const points = calcScore(rawScore, criterion.weight ?? 0);
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
                              value={currentScore ? Number(points.toFixed(2)) : ""}
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
                      <div className="flex gap-4">
                        {criterion.levels.map((level) => (
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
                            className={`text-xs ${getTagColor(currentScore?.tag || "")}`}
                          >
                            {currentScore?.tag || "N/A"}
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
                            (currentScore.rawScore / (grading.scaleFactor ?? 10)) * 100
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
          <TabsContent value="tests" className="flex-1 overflow-auto px-4 pb-4">
            {/* ...add test results if needed... */}
          </TabsContent>
          <TabsContent value="overview" className="flex-1 overflow-auto px-4 pb-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Feedback Overview
              </h3>
              <div className="rounded-lg border p-4">
                <div dangerouslySetInnerHTML={{ __html: feedbackOverview }} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};
