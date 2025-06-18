import React, { useEffect, useState } from "react";
import {
  Save,
  Eye,
  Edit3,
  PanelLeftClose,
  PanelLeftOpen,
  EyeClosed,
  MessageSquare,
  Trash,
} from "lucide-react";
import { Assessment, AssessmentSchema, FeedbackItem } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import FileViewer from "./viewer/file-viewer";
import ExportDialog from "@/pages/assessment/edit-assessment/export-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/clerk-react";
import { AssessmentService } from "@/services/assessment-service";
import { toast } from "sonner";
import { loadFileItems } from "@/services/file-service";
import { getFileIcon, getTestStatusIcon, getTagColor } from "./icon-utils";
import { FileExplorer } from "./file-explorer";
import { ScoringPanel } from "./scoring-panel";

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
  const [files, setFiles] = useState<any[]>([]);
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
  const [bottomPanelHeight, setBottomPanelHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [activeScoringTab, setActiveScoringTab] = useState<string>(
    rubric.criteria[0]?.name || "",
  );

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
    // return sum + (breakdown.rawScore * ((weight * scale) / 100)) / 100;
  }, 0);

  const handleFeedbackClick = (feedback: FeedbackItem, index: number) => {
    if (selectedFeedbackIndex === index) {
      setSelectedFeedbackIndex(null);
      setSelectedFeedback(null);
      return;
    }
    setSelectedFeedbackIndex(index);
    setSelectedFeedback(feedback);
    const lines = [];
    if (typeof feedback.fromLine === "number" && typeof feedback.toLine === "number") {
      for (let i = feedback.fromLine; i <= feedback.toLine; i++) {
        lines.push(i);
      }
    }

    const normalizeFileRef = (fileRef: string) => {
      const lastSlash = fileRef.lastIndexOf("/");
      if (lastSlash !== -1) {
        return fileRef.substring(lastSlash + 1);
      }
      return fileRef;
    };
    const file = files.find(
      (f) =>
        f.name === normalizeFileRef(feedback.fileRef) ||
        f.path === normalizeFileRef(feedback.fileRef),
    );
    if (file) {
      setSelectedFile(file);
    }
  };

  // Helper to get file extension
  const getFileExtension = (fileName: string) => {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
  };

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
  // Update feedbacks from child viewer (merged with addFeedback)
  const handleUpdateFeedback = (newFeedbacks: FeedbackItem[]) => {
    if (!selectedFile) return;
    const fileName = selectedFile.name;
    const normalizeFileRef = (fileRef: string) => {
      try {
        const lastSlash = fileRef.lastIndexOf("/");
        if (lastSlash !== -1) {
          return fileRef.substring(lastSlash + 1);
        }
        return fileRef;
      } catch {
        return fileRef;
      }
    };
    const current = formData.feedbacks;
    newFeedbacks
      .map((fb) => ({
        ...fb,
        fileRef: normalizeFileRef(fb.fileRef),
      }))
      .filter((fb) => fb.fileRef === fileName)
      .forEach((newFb) => {
        // Tránh thêm trùng comment cho cùng fileRef, fromLine, toLine, criterion
        const isDuplicate = current.some(
          (fb) =>
            fb.fileRef === newFb.fileRef &&
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
  const handleSave = async () => {
    console.log("Saving assessment data:", formData);

    try {
      const token = await auth.getToken();
      if (!token) {
        throw new Error("You must be logged in to save a rubric");
      }

      await AssessmentService.updateFeedback(assessment.id, formData.feedbacks, token);
      await AssessmentService.updateScore(assessment.id, formData.scoreBreakdowns, token);
    } catch (err) {
      toast.error("Failed to update rubric");
      console.error(err);
    }

    return;
  };

  // Render file content with line numbers and highlights
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
    const fileUrl = selectedFile.blobPath;
    const ext = getFileExtension(selectedFile.name);
    const fileName = selectedFile.name;
    const normalizeFileRef = (fileRef: string) => {
      if (!fileRef) return "";
      try {
        return fileRef.split("/").pop() || fileRef;
      } catch {
        return fileRef;
      }
    };
    const fileFeedbacks = formData.feedbacks.filter(
      (fb) =>
        normalizeFileRef(fb.fileRef) === fileName ||
        normalizeFileRef(fb.fileRef) === selectedFile.path,
    );
    // Lấy danh sách tiêu chí rubric
    const rubricCriteria = rubric.criteria.map((c) => c.name);
    return (
      <FileViewer
        fileType={ext}
        fileUrl={fileUrl}
        content={selectedFile.content} // truyền content
        feedbacks={fileFeedbacks}
        updateFeedback={handleUpdateFeedback}
        isHighlightMode={isHighlightMode}
        onHighlightComplete={() => setIsHighlightMode(false)}
        activeFeedbackId={
          selectedFeedbackIndex !== null ? String(selectedFeedbackIndex) : undefined
        }
        rubricCriteria={rubricCriteria}
      />
    );
  };

  // Group files by folder (nếu muốn group theo prefix, có thể sửa lại)
  const filesByFolder = files.reduce(
    (acc, file) => {
      const folder = file.path.includes("/") ? file.path.split("/")[0] : "root";
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(file);
      return acc;
    },
    {} as Record<string, typeof files>,
  );

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

  return (
    // Add className to root div to enable dark mode based on html/body class
    <div
      className="flex flex-col dark:bg-background dark:text-foreground"
      style={{ height: "110dvh", minHeight: "100vh" }} // <-- make the main container always fill viewport height
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
            <ExportDialog assessmentData={formData} />
            <Button className="cursor-pointer" size="sm" onClick={handleSave}>
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
            filesByFolder={filesByFolder}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            expandedFolders={expandedFolders}
            setExpandedFolders={setExpandedFolders}
            feedbacks={formData.feedbacks}
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

            {/* Feedback Panel */}
            <div className="w-80 border-l flex flex-col min-h-0">
              <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
                <h3 className="text-sm font-medium mb-3">
                  Feedback (
                  {selectedFile ?
                    formData.feedbacks.filter((f) => {
                      // Normalize fileRef to just the filename
                      const fileRefName = f.fileRef?.split("/").pop();
                      return fileRefName === selectedFile.name;
                    }).length
                  : 0}
                  )
                </h3>

                <div className="space-y-3 scroll-smooth">
                  {selectedFile &&
                    formData.feedbacks
                      .filter((feedback) => {
                        const fileRefName = feedback.fileRef?.split("/").pop();
                        return fileRefName === selectedFile.name;
                      })
                      .map((feedback, index) => (
                        <Card
                          key={index}
                          className={`cursor-pointer pt-1 text-muted-foreground ${
                            (
                              selectedFeedback &&
                              selectedFeedback.fileRef === feedback.fileRef &&
                              selectedFeedback.fromLine === feedback.fromLine &&
                              selectedFeedback.toLine === feedback.toLine &&
                              selectedFeedback.comment === feedback.comment &&
                              selectedFeedback.criterion === feedback.criterion
                            ) ?
                              "ring-2 ring-blue-500 shadow-md"
                            : "hover:shadow-md"
                          }`}
                          onClick={() => handleFeedbackClick(feedback, index)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4  text-gray-500" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-600">
                                    {feedback.criterion}
                                  </span>
                                  <Badge
                                    className={`text-xs ${getTagColor(feedback.tag)}`}
                                  >
                                    {feedback.tag}
                                  </Badge>
                                  <Trash
                                    className="h-4 w-4 text-gray-500 cursor-pointer hover:text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFeedback(index);
                                    }}
                                  />
                                </div>
                                <div className="text-xs text-gray-500 mb-1">
                                  Lines {feedback.fromLine}-{feedback.toLine}
                                </div>
                                <p className="text-sm">{feedback.comment}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                  {(!selectedFile ||
                    formData.feedbacks.filter(
                      (f) =>
                        f.fileRef === selectedFile.name ||
                        f.fileRef === selectedFile.path,
                    ).length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No feedback for this file</p>
                    </div>
                  )}
                </div>
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
