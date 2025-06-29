import React, { useEffect, useState } from "react";
import equal from "fast-deep-equal";
import { Save, Eye, Edit3, PanelLeftClose, PanelLeftOpen, EyeClosed } from "lucide-react";
import { Assessment, AssessmentSchema, FeedbackItem } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import FileViewer from "./viewer/file-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/clerk-react";
import { AssessmentService } from "@/services/assessment-service";
import { toast } from "sonner";
import { loadFileItems } from "@/services/file-service";
import { getFileIcon } from "./icon-utils";
import { FileExplorer } from "@/components/app/file-explorer";
import { ScoringPanel } from "./scoring-panel";
import { ExportDialog } from "@/components/app/export-dialog";
import { AssessmentExporter } from "@/lib/exporters";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FeedbackListPanel } from "./feedback-list-panel";

export function EditAssessmentUI({
  assessment,
  grading,
  rubric,
}: {
  assessment: Assessment;
  grading: GradingAttempt;
  rubric: Rubric;
}) {
  const form = useForm<Assessment>({
    resolver: zodResolver(AssessmentSchema),
    defaultValues: assessment,
    mode: "onChange",
  });

  const formData = form.watch();
  const [initialData, setInitialData] = useState<{
    scoreBreakdowns: Assessment["scoreBreakdowns"];
    feedbacks: Assessment["feedbacks"];
  } | null>(null);
  const isDirty =
    initialData !== null &&
    (!equal(formData.scoreBreakdowns, initialData.scoreBreakdowns) ||
      !equal(formData.feedbacks, initialData.feedbacks));
  const [files, setFiles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [selectedFeedbackIndex, setSelectedFeedbackIndex] = useState<number | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    tests: true,
  });
  const [activeTab, setActiveTab] = useState("scoring");
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [activeScoringTab, setActiveScoringTab] = useState<string>(
    rubric.criteria[0]?.name || "",
  );
  const [feedbackViewMode, setFeedbackViewMode] = useState<"file" | "criterion">("file");
  useEffect(() => {
    async function load() {
      const items = await loadFileItems(`${grading.id}/${formData.submissionReference}`);
      setFiles(items);
      setSelectedFile(items[0] || null);
    }

    if (formData.submissionReference) load();
  }, [formData.submissionReference, grading.id]);
  useEffect(() => {
    if (!initialData) {
      setInitialData({
        scoreBreakdowns: formData.scoreBreakdowns,
        feedbacks: formData.feedbacks,
      });
    }
  }, [files, formData.feedbacks]);
  const totalScore = formData.scoreBreakdowns.reduce((sum, breakdown) => {
    const criterion = rubric.criteria.find((c) => c.name === breakdown.criterionName);
    const weight = criterion?.weight || 0;
    const scale = grading.scaleFactor ?? 10;
    return sum + ((breakdown.rawScore / weight) * (weight * scale)) / 100;
  }, 0);

  // Add feedback handler (toggle highlight mode)
  const handleAddFeedbackClick = () => {
    setIsHighlightMode((prev) => !prev);
    setSelectedFeedback(null);
  };

  const handleUpdateScore = (criterionName: string, newScore: number) => {
    const criterion = rubric.criteria.find((c) => c.name === criterionName);
    if (!criterion) return;

    let matchedLevel = criterion.levels
      .filter((l) => l.weight <= newScore)
      .sort((a, b) => b.weight - a.weight)[0];

    if (!matchedLevel && criterion.levels.length > 0) {
      matchedLevel = criterion.levels.reduce(
        (min, l) => (l.weight < min.weight ? l : min),
        criterion.levels[0],
      );
    }

    const updated = formData.scoreBreakdowns.map((sb) =>
      sb.criterionName === criterionName ?
        {
          ...sb,
          performanceTag: matchedLevel ? matchedLevel.tag : "",
          rawScore: (newScore * (criterion.weight ?? 0)) / 100,
        }
      : sb,
    );

    form.setValue("scoreBreakdowns", updated, { shouldValidate: true });
  };
  const isFeedbackForFile = (fb: FeedbackItem, file: any) => {
    try {
      if (fb.fileRef && file.relativePath && fb.fileRef.endsWith(file.relativePath))
        return true;
    } catch {}
    return false;
  };

  const handleUpdateFeedback = (
    index: number,
    updatedFeedback: Partial<FeedbackItem>,
  ) => {
    const currentFeedbacks = [...formData.feedbacks];

    if (index >= 0 && index < currentFeedbacks.length) {
      currentFeedbacks[index] = {
        ...currentFeedbacks[index],
        ...updatedFeedback,
      };

      form.setValue("feedbacks", currentFeedbacks, { shouldValidate: true });
      return true;
    }

    return false;
  };

  const handleAddNewFeedback = (newFeedback: FeedbackItem) => {
    const currentFeedbacks = [...formData.feedbacks];
    currentFeedbacks.push(newFeedback);

    form.setValue("feedbacks", currentFeedbacks, { shouldValidate: true });
    const newIndex = currentFeedbacks.length - 1;
    setSelectedFeedbackIndex(newIndex);
    setSelectedFeedback(newFeedback);

    return newIndex;
  };

  const handleDeleteFeedback = (index: number) => {
    const current = formData.feedbacks;
    const updated = current.filter((_, i) => i !== index);
    form.setValue("feedbacks", updated, { shouldValidate: true });
  };

  const handleSaveFeedback = async () => {
    try {
      const token = await auth.getToken();
      if (!token) {
        throw new Error("You must be logged in to update feedback");
      }
      await AssessmentService.updateFeedback(assessment.id, formData.feedbacks, token);
      toast.success("Feedback updated successfully");
    } catch (err) {
      toast.error("Failed to update feedback");
      console.error(err);
    }
  };

  const handleSaveScore = async () => {
    try {
      const token = await auth.getToken();
      if (!token) {
        throw new Error("You must be logged in to update score");
      }
      await AssessmentService.updateScore(assessment.id, formData.scoreBreakdowns, token);
      toast.success("Score updated successfully");
    } catch (err) {
      toast.error("Failed to update score");
      console.error(err);
    }
  };

  const handleSaveAssessment = async () => {
    console.log("Saving assessment data:", formData);
    await handleSaveFeedback();
    // await handleSaveScore();
    return;
  };

  const handleExport = () => {
    if (isDirty) {
      toast.warning("You have unsaved changes. Please save before exporting.");
      return;
    }
    setOpen(true);
  };
  // Render file content with line numbers and highlights

  // Handle mouse down on resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const containerRect = document
      .querySelector(".flex.flex-col.bg-background")
      ?.getBoundingClientRect();
    if (!containerRect) return;

    const minHeight = 120;
    const maxHeight = containerRect.height * 0.6;

    const newHeight = containerRect.bottom - e.clientY;

    const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);

    if (Math.abs(clampedHeight - bottomPanelHeight) > 2) {
      setBottomPanelHeight(clampedHeight);
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add event listeners
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const handleFeedbackSelect = (feedback: FeedbackItem, index?: number) => {
    if (
      selectedFeedback &&
      selectedFeedback.fileRef === feedback.fileRef &&
      selectedFeedback.criterion === feedback.criterion &&
      selectedFeedback.comment === feedback.comment &&
      JSON.stringify(selectedFeedback.locationData) ===
        JSON.stringify(feedback.locationData)
    ) {
      setSelectedFeedback(null);
      setSelectedFeedbackIndex(null);
      return;
    }
    const file = files.find((f) => isFeedbackForFile(feedback, f));
    if (file) setSelectedFile(file);
    setSelectedFeedback(feedback);
    if (typeof index === "number") setSelectedFeedbackIndex(index);
  };

  // Hàm chuẩn hóa feedback giống code-viewer

  useEffect(() => {
    if (!initialData) {
      setInitialData({
        scoreBreakdowns: formData.scoreBreakdowns,
        feedbacks: formData.feedbacks,
      });
    }
  }, [files, formData.feedbacks]);
  const renderFileContent = () => {
    if (!selectedFile) return <div className="text-gray-400 p-8">No file selected</div>;
    let prefix = assessment.submissionReference;
    const underscoreIdx = prefix.indexOf("_");
    if (underscoreIdx !== -1) {
      prefix = prefix.substring(0, underscoreIdx);
    }
    if (!prefix.endsWith("/")) {
      prefix += "/";
    }
    const fileFeedbacks = formData.feedbacks.filter((fb) =>
      isFeedbackForFile(fb, selectedFile),
    );
    return (
      <FileViewer
        rubricCriteria={rubric.criteria.map((c) => c.name)}
        gradingId={grading.id}
        submissionReference={formData.submissionReference}
        file={selectedFile}
        feedbacks={fileFeedbacks}
        feedbacksAll={formData.feedbacks}
        addFeedback={handleAddNewFeedback}
        updateFeedback={handleUpdateFeedback}
        isHighlightMode={isHighlightMode}
        onHighlightComplete={() => setIsHighlightMode(false)}
        activeFeedbackId={
          selectedFeedbackIndex !== null ? String(selectedFeedbackIndex) : undefined
        }
      />
    );
  };

  return (
    <div
      className="-mb-20 flex flex-col bg-background text-foreground"
      style={{
        height: "85vh",
        maxHeight: "100vh",
        position: "relative",
      }}
    >
      {/* Header with fixed height */}
      <div className="p-4 flex-shrink-0" style={{ height: "72px" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
              className="p-2"
            >
              {isFileExplorerOpen ?
                <PanelLeftClose className="h-4 w-4" />
              : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
            <div>
              <h1 className="text-xl font-bold">Review Assessment</h1>
              <p className="text-sm text-gray-500">
                {rubric.rubricName} • Total Score: {totalScore.toFixed(1)}/
                {grading.scaleFactor}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowBottomPanel((v) => !v)}>
              {showBottomPanel ?
                <EyeClosed className="h-4 w-4 mr-2" />
              : <Eye className="h-4 w-4 mr-2" />}
              {showBottomPanel ? "Hide Scoring" : "Show Scoring"}
            </Button>
            <Button onClick={handleExport} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Export
            </Button>
            <ExportDialog
              open={open}
              onOpenChange={setOpen}
              exporterClass={AssessmentExporter}
              args={[formData]}
            />
            <Button className="cursor-pointer" size="sm" onClick={handleSaveAssessment}>
              <Save className="h-4 w-4 mr-2" />
              Save Assessment
            </Button>
          </div>
        </div>
      </div>

      <div
        className="flex"
        style={{
          height:
            showBottomPanel ?
              `calc(100% - 72px - ${bottomPanelHeight}px)`
            : "calc(100% - 72px - 20px)",
          minHeight: 0,
        }}
      >
        {/* File Explorer với width cố định */}
        {isFileExplorerOpen && files.length > 0 && (
          <FileExplorer
            files={files}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            expandedFolders={expandedFolders}
            setExpandedFolders={setExpandedFolders}
            feedbacks={formData.feedbacks}
            grading={grading}
          />
        )}

        {/* Main Content + Feedback Panel */}
        <div className="flex-1 flex flex-row" style={{ minWidth: 0 }}>
          {/* File Viewer - không cần điều chỉnh height, luôn 100% */}
          <div
            className="flex-1 flex flex-col h-full"
            style={{
              minWidth: 0,
              position: "relative",
            }}
          >
            <div className="p-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedFile && getFileIcon(selectedFile)}
                  <h2 className="text-lg font-medium">
                    {selectedFile?.name || "No file selected"}
                  </h2>
                  <Badge variant="outline">{selectedFile?.type}</Badge>
                </div>
                <Button
                  variant={isHighlightMode ? "default" : "outline"}
                  size="sm"
                  className={isHighlightMode ? "bg-blue-600 text-white" : ""}
                  onClick={handleAddFeedbackClick}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {isHighlightMode ? "Exit Feedback" : "Add Feedback"}
                </Button>
              </div>
              {isHighlightMode && selectedFile && (
                <div className="mt-2 text-blue-700 text-sm font-medium">
                  {selectedFile.type === "code" &&
                    "Click and drag to highlight and add feedback. Click again to exit."}
                </div>
              )}
            </div>
            {selectedFile && selectedFile.type === "code" ?
              renderFileContent()
            : <div
                className="flex-1 overflow-auto"
                style={{
                  minWidth: 0,
                  minHeight: 0,
                }}
              >
                {renderFileContent()}
              </div>
            }
          </div>

          {/* Feedback Panel with View Mode Toggle */}
          <div className="ml-4 w-70 max-w-60 text-wrap overflow-auto">
            {/* Feedback View Mode Toggle + Content (shadcn Tabs) */}
            <Tabs
              value={feedbackViewMode}
              onValueChange={(v) => setFeedbackViewMode(v as "file" | "criterion")}
            >
              <TabsList className="w-full rounded-lg p-1 flex">
                <TabsTrigger
                  value="file"
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
                >
                  By File
                </TabsTrigger>
                <TabsTrigger
                  value="criterion"
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
                >
                  By Criterion
                </TabsTrigger>
              </TabsList>
              <TabsContent value="file">
                <h3 className="text-sm font-medium mb-3">
                  Feedback for {selectedFile?.name}
                </h3>
                <FeedbackListPanel
                  feedbacks={formData.feedbacks.filter((f) => {
                    const fileRefName = f.fileRef?.split("/").pop();
                    return fileRefName === selectedFile?.name;
                  })}
                  selectedFeedbackIndex={selectedFeedbackIndex}
                  onSelect={handleFeedbackSelect}
                  onDelete={handleDeleteFeedback}
                  allFeedbacks={formData.feedbacks}
                />
              </TabsContent>
              <TabsContent value="criterion">
                <h3 className="text-sm font-medium mb-3">
                  Feedback for {activeScoringTab}
                </h3>
                <FeedbackListPanel
                  feedbacks={formData.feedbacks.filter(
                    (f) => f.criterion === activeScoringTab,
                  )}
                  selectedFeedbackIndex={selectedFeedbackIndex}
                  onSelect={handleFeedbackSelect}
                  onDelete={handleDeleteFeedback}
                  allFeedbacks={formData.feedbacks}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* ScoringPanel với vị trí tuyệt đối, chiếm toàn bộ chiều rộng trang */}
      {showBottomPanel && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: bottomPanelHeight,
            zIndex: 20,
            borderTop: "1px solid var(--border-color, #e5e7eb)",
          }}
        >
          <ScoringPanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeScoringTab={activeScoringTab}
            setActiveScoringTab={setActiveScoringTab}
            rubric={rubric}
            grading={grading}
            formData={formData}
            isResizing={isResizing}
            handleMouseDown={handleMouseDown}
            updateScore={handleUpdateScore}
          />
        </div>
      )}
    </div>
  );
}
