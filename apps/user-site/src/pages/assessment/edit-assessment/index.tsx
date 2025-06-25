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
import { FileExplorer } from "./file-explorer";
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
  // Lưu dữ liệu gốc khi mount
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
  }, [formData.submissionReference]);

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
      const url = new URL(fb.fileRef, "http://dummy");
      if (url.pathname.endsWith("/" + file.relativePath)) return true;
    } catch {}
    return false;
  };

  // Update feedbacks from child viewer (merged with addFeedback)
  const handleUpdateFeedback = (newFeedbacks: FeedbackItem[]) => {
    if (!selectedFile) return;
    const fileRelativePath = selectedFile.relativePath;
    const current = formData.feedbacks;
    newFeedbacks
      .map((fb) => ({
        ...fb,
        fileRef: fileRelativePath, // luôn dùng relativePath mới
      }))
      .forEach((newFb) => {
        const isDuplicate = current.some(
          (fb) =>
            isFeedbackForFile(fb, selectedFile) &&
            fb.fromLine === newFb.fromLine &&
            fb.toLine === newFb.toLine &&
            fb.criterion === newFb.criterion &&
            fb.comment === newFb.comment,
        );
        if (!isDuplicate) {
          form.setValue("feedbacks", [...formData.feedbacks, newFb], {
            shouldValidate: true,
          });
        }
      });
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
    // await handleSaveFeedback();
    await handleSaveScore();
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

  // Handle mouse move for resizing
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    // Lấy vị trí top của panel resize (so với viewport)
    const mainPanel = document.querySelector(".flex-1.flex.flex-col.overflow-hidden");
    let panelTop = 0;
    let windowHeight = window.innerHeight;
    if (mainPanel) {
      const rect = (mainPanel as HTMLElement).getBoundingClientRect();
      panelTop = rect.top;
      windowHeight = rect.height;
    }

    const minHeight = 120;
    const maxHeight = windowHeight * 0.9;

    // Tính chiều cao mới dựa trên vị trí chuột so với top của panel
    const mouseY = e.clientY - panelTop;
    const newHeight = windowHeight - mouseY;
    setBottomPanelHeight(Math.min(Math.max(newHeight, minHeight), maxHeight));
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

  // Add custom CSS for slider
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
    .slider::-webkit-slider-thumb {
      appearance: none;
      height: 20px;
      width: 20px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .slider::-moz-range-thumb {
      height: 20px;
      width: 20px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Feedback overview placeholder
  const feedbackOverview = "No overview available.";

  const handleFeedbackSelect = (feedback: FeedbackItem, index?: number) => {
    if (
      selectedFeedback &&
      selectedFeedback.fileRef === feedback.fileRef &&
      selectedFeedback.fromLine === feedback.fromLine &&
      selectedFeedback.toLine === feedback.toLine &&
      selectedFeedback.comment === feedback.comment &&
      selectedFeedback.criterion === feedback.criterion
    ) {
      setSelectedFeedback(null);
      setSelectedFeedbackIndex(null);
      return;
    }
    const file = files.find((f) => isFeedbackForFile(feedback, f));
    if (file) setSelectedFile(file);
    setSelectedFeedback(feedback);
    if (typeof index === "number") setSelectedFeedbackIndex(index);
    setTimeout(() => {
      const el = document.querySelector(`[data-feedback-id="${index}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (typeof feedback.fromLine === "number") {
        const lineEl =
          document.querySelector(`[data-line="${feedback.fromLine}"]`) ||
          document.querySelector(`.line-number-${feedback.fromLine}`);
        if (lineEl) {
          lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 200);
  };

  // Hàm chuẩn hóa feedback giống code-viewer
  function getAdjustedFeedbacks(
    content: string,
    feedbacks: FeedbackItem[],
  ): FeedbackItem[] {
    const rawLines = content.split(/\r?\n/);
    const lines = rawLines.map((l) => l.trimEnd());
    const totalLines = lines.length;
    return feedbacks
      .filter((fb) => {
        const { fromLine, toLine } = fb;
        if (
          typeof fromLine !== "number" ||
          typeof toLine !== "number" ||
          (fromLine > totalLines && toLine > totalLines)
        ) {
          return false;
        }
        return true;
      })
      .map((fb) => {
        let { fromLine, toLine, fromCol, toCol } = fb;
        fromCol = typeof fromCol === "number" ? fromCol : 0;
        toCol = typeof toCol === "number" ? toCol : 0;
        if (typeof toLine === "number" && toLine > totalLines) {
          toLine = totalLines;
          toCol = lines[totalLines - 1]?.length ?? 0;
        }
        const fromLineLen = lines[fromLine! - 1]?.length ?? 0;
        const toLineLen = lines[toLine! - 1]?.length ?? 0;
        const adjustedFromCol = Math.max(0, Math.min(fromCol, fromLineLen));
        const adjustedToCol = Math.max(0, Math.min(toCol, toLineLen));
        return {
          ...fb,
          fromLine,
          toLine,
          fromCol: adjustedFromCol,
          toCol: adjustedToCol,
        };
      });
  }

  useEffect(() => {
    if (!files.length || !formData.feedbacks.length) return;
    let allValid: FeedbackItem[] = [];
    files.forEach((file) => {
      const content = file.content || "";
      // Lấy feedback cho file này (hỗ trợ backward compatibility)
      const feedbacksOfFile = formData.feedbacks.filter((fb) =>
        isFeedbackForFile(fb, file),
      );
      allValid = allValid.concat(getAdjustedFeedbacks(content, feedbacksOfFile));
    });
    if (
      allValid.length !== formData.feedbacks.length ||
      JSON.stringify(allValid) !== JSON.stringify(formData.feedbacks)
    ) {
      form.setValue("feedbacks", allValid, { shouldValidate: true });
    } else if (!initialData) {
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
    // Lấy danh sách tiêu chí rubric

    return (
      <FileViewer
        file={selectedFile}
        feedbacks={fileFeedbacks}
        feedbacksAll={formData.feedbacks}
        updateFeedback={handleUpdateFeedback}
        isHighlightMode={isHighlightMode}
        onHighlightComplete={() => setIsHighlightMode(false)}
        activeFeedbackId={
          selectedFeedbackIndex !== null ? String(selectedFeedbackIndex) : undefined
        }
        rubricCriteria={rubric.criteria.map((c) => c.name)}
      />
    );
  };

  return (
    // Add className to root div to enable dark mode based on html/body class
    <div
      className="flex flex-col dark:bg-background dark:text-foreground"
      style={{ height: "130dvh", maxHeight: "140dvh" }} // <-- make the main container always fill viewport height
    >
      {/* Header */}
      <div className="p-4">
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

      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* File Viewer */}
          <div
            className="flex"
            style={{
              height: 0,
              flex: "1 1 auto",
              minHeight: 0,
              overflowX: "hidden",
              overflowY: "visible",
            }}
          >
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b ">
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
                {isHighlightMode && (
                  <div className="mt-2 text-blue-700 text-sm font-medium">
                    Click and drag to highlight and add feedback. Click again to exit.
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {renderFileContent()}
              </div>
            </div>

            {/* Feedback Panel with View Mode Toggle */}
            <div className="w-80 border-l overflow-y-auto">
              <div className="p-4">
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
                    <FeedbackListPanel
                      feedbacks={formData.feedbacks.filter((f) => {
                        const fileRefName = f.fileRef?.split("/").pop();
                        return fileRefName === selectedFile?.name;
                      })}
                      selectedFeedbackIndex={selectedFeedbackIndex}
                      onSelect={handleFeedbackSelect}
                      onDelete={handleDeleteFeedback}
                      title={`Feedback for ${selectedFile?.name}`}
                      emptyText="No feedback for this file"
                      allFeedbacks={formData.feedbacks}
                    />
                  </TabsContent>
                  <TabsContent value="criterion">
                    <FeedbackListPanel
                      feedbacks={formData.feedbacks.filter(
                        (f) => f.criterion === activeScoringTab,
                      )}
                      selectedFeedbackIndex={selectedFeedbackIndex}
                      onSelect={handleFeedbackSelect}
                      onDelete={handleDeleteFeedback}
                      title={`Feedback by ${activeScoringTab}`}
                      emptyText="No feedback for this criterion"
                      allFeedbacks={formData.feedbacks}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Resize Handle & Bottom Panel */}
          {showBottomPanel && (
            <ScoringPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeScoringTab={activeScoringTab}
              setActiveScoringTab={setActiveScoringTab}
              rubric={rubric}
              grading={grading}
              formData={formData}
              bottomPanelHeight={bottomPanelHeight}
              isResizing={isResizing}
              handleMouseDown={handleMouseDown}
              feedbackOverview={feedbackOverview}
              updateScore={handleUpdateScore}
            />
          )}
        </div>
      </div>
    </div>
  );
}
