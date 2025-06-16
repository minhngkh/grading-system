import React, { useEffect, useState } from "react";
import {
  FileText,
  Code,
  Folder,
  FolderOpen,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Info,
  Save,
  Download,
  Eye,
  Edit3,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  XCircle,
  Clock,
  EyeClosed,
} from "lucide-react";
import {
  Assessment,
  AssessmentSchema,
  FeedbackItem,
  ScoreBreakdown,
} from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import FileViewer from "./viewer/file-viewer";
import ExportDialog from "@/pages/review/manual-grade/export-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function RubricAssessmentUI({
  assessment,
  scaleFactor,
  rubric,
}: {
  assessment: Assessment;
  scaleFactor: number;
  rubric: Rubric;
}) {
  const form = useForm<Assessment>({
    resolver: zodResolver(AssessmentSchema),
    defaultValues: assessment,
    mode: "onChange",
  });
  const formData = form.watch();
  const [blobFiles, setBlobFiles] = useState<string[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
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
  const [showScoringTab, setShowScoringTab] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  // Add highlight/feedback mode state
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [activeScoringTab, setActiveScoringTab] = useState<string>(
    rubric.criteria[0]?.name || "",
  );
  console.log("Assessment data:", formData);

  // Fetch blob list
  useEffect(() => {
    async function fetchBlobList() {
      try {
        // Remove everything from the first underscore to the end
        let prefix = assessment.submissionReference;
        const underscoreIdx = prefix.indexOf("_");
        if (underscoreIdx !== -1) {
          prefix = prefix.substring(0, underscoreIdx);
        }
        // Ensure trailing slash
        if (!prefix.endsWith("/")) {
          prefix += "/";
        }
        const response = await fetch(
          `http://127.0.0.1:51157/devstoreaccount1/submissions-store?restype=container&comp=list&prefix=${prefix}`,
        );
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");
        const blobs = Array.from(xmlDoc.getElementsByTagName("Blob"))
          .map((blob) => blob.getElementsByTagName("Name")[0]?.textContent || "")
          .filter(Boolean);
        setBlobFiles(blobs);
        console.log("Fetched blobs:", blobs);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách blobs:", error);
      }
    }
    fetchBlobList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment.submissionReference]);

  // Convert blobFiles to files for explorer
  useEffect(() => {
    async function buildFiles() {
      const fileList = await Promise.all(
        blobFiles.map(async (blob, idx) => {
          // Lấy tên file (sau dấu / cuối)
          const name = blob.split("/").pop() || blob;
          // Đoán loại file
          let type: "code" | "document" | "image" | "pdf" = "code";
          if (/\.(jpg|jpeg|png|gif)$/i.test(name)) type = "image";
          else if (/\.pdf$/i.test(name)) type = "pdf";
          else if (/\.md$/i.test(name)) type = "document";
          else if (/\.txt$/i.test(name)) type = "code";
          else if (/\.cpp|\.py|\.js|\.ts|\.java|\.c|\.h$/i.test(name)) type = "code";
          else type = "code";
          // Nếu là code/text/document thì fetch nội dung
          let content = "";
          if (type === "code" || type === "document") {
            try {
              const url = `http://127.0.0.1:51157/devstoreaccount1/submissions-store/${blob}`;
              const res = await fetch(url);
              content = await res.text();
            } catch {
              content = "// Cannot load file content";
            }
          }
          console.log("content" + idx + ":", content);
          return {
            id: String(idx + 1),
            name,
            type,
            path: name, // hoặc blob nếu muốn path đầy đủ
            blobPath: blob,
            content,
          };
        }),
      );
      setFiles(fileList);

      if (fileList.length > 0 && !selectedFile) {
        setSelectedFile(fileList[0]);
      }
    }
    if (blobFiles.length > 0) buildFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobFiles]);
  // Calculate totalScore using scaleFactor
  const totalScore = formData.scoreBreakdowns.reduce((sum, breakdown) => {
    const criterion = rubric.criteria.find((c) => c.name === breakdown.criterionName);
    const weight = criterion?.weight || 0;
    // Each criterion's score: (rawScore/scaleFactor) * weight
    return sum + (breakdown.rawScore * ((weight * scaleFactor) / 100)) / 100;
  }, 0);

  // Get file icon based on type
  const getFileIcon = (file: { type: string; name: string }) => {
    switch (file.type) {
      case "code":
        return <Code className="h-4 w-4 text-blue-500" />;
      case "document":
        if (file.name.endsWith(".md"))
          return <FileText className="h-4 w-4 text-green-500" />;
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get feedback icon based on tag
  const getFeedbackIcon = (tag: string) => {
    switch (tag) {
      case "Excellent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Good":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "Satisfactory":
        return <Info className="h-4 w-4 text-yellow-500" />;
      case "Needs Improvement":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4  text-gray-500" />;
    }
  };

  // Get test status icon
  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <PlayCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get tag color
  const getTagColor = (tag: string) => {
    switch (tag) {
      case "Excellent":
        return "bg-green-100 text-green-800 border-green-200";
      case "Good":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Satisfactory":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Needs Improvement":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Handle feedback click (only for text feedback)
  const handleFeedbackClick = (feedback: FeedbackItem, index: number) => {
    if (selectedFeedbackIndex === index) {
      setSelectedFeedbackIndex(null);
      setHighlightedLines([]);
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
    setHighlightedLines(lines);

    // Normalize fileRef for comparison
    const normalizeFileRef = (fileRef: string) => {
      const lastSlash = fileRef.lastIndexOf("/");
      if (lastSlash !== -1) {
        return fileRef.substring(lastSlash + 1);
      }
      return fileRef;
    };
    // Switch to the file referenced in feedback
    const file = files.find(
      (f) =>
        f.name === normalizeFileRef(feedback.fileRef) ||
        f.path === normalizeFileRef(feedback.fileRef),
    );
    if (file) {
      setSelectedFile(file);
    }
  };

  const updateScore1 = (criterionName: string, newScore: number) => {
    const criterion = rubric.criteria.find((c) => c.name === criterionName);
    if (!criterion) return;

    // Tìm level phù hợp theo newScore
    let matchedLevel = criterion.levels
      .filter((l) => l.weight <= newScore)
      .sort((a, b) => b.weight - a.weight)[0];

    if (!matchedLevel && criterion.levels.length > 0) {
      matchedLevel = criterion.levels.reduce(
        (min, l) => (l.weight < min.weight ? l : min),
        criterion.levels[0],
      );
    }

    // Cập nhật lại scoreBreakdowns bằng form.setValue
    const updated = formData.scoreBreakdowns.map((sb) =>
      sb.criterionName === criterionName ?
        {
          ...sb,
          tag: matchedLevel ? matchedLevel.tag : "",
          rawScore: newScore,
        }
      : sb,
    );

    form.setValue("scoreBreakdowns", updated, { shouldValidate: true });
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
    setHighlightedLines([]);
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

  // Render file content with line numbers and highlights
  const renderFileContent = () => {
    if (!selectedFile) return <div className="text-gray-400 p-8">No file selected</div>;
    // Chỉ truyền feedbacks của file hiện tại cho FileViewer
    // Build prefix from submissionReference (remove from _ onward, ensure trailing slash)
    let prefix = assessment.submissionReference;
    const underscoreIdx = prefix.indexOf("_");
    if (underscoreIdx !== -1) {
      prefix = prefix.substring(0, underscoreIdx);
    }
    if (!prefix.endsWith("/")) {
      prefix += "/";
    }
    const fileUrl = `http://127.0.0.1:51157/devstoreaccount1/submissions-store/${selectedFile.blobPath}`;
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
    // Lấy feedbacks mới nhất từ formData, filter đúng theo file hiện tại
    const allFeedbacks = formData.feedbacks;
    const fileFeedbacks = allFeedbacks.filter(
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

    const containerHeight = window.innerHeight - 80; // Subtract header height
    const newHeight = containerHeight - e.clientY + 80;
    const minHeight = 200;
    const maxHeight = containerHeight * 0.8;

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
    <div className="h-screen flex flex-col dark:bg-background dark:text-foreground">
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
                {rubric.rubricName} • Total Score: {totalScore.toFixed(1)}/{scaleFactor}
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
            <Button size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Assessment
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {isFileExplorerOpen && files.length > 0 && (
          <div className="w-64 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium  mb-3">Project Files</h3>
              <div className="space-y-1">
                {Object.entries(filesByFolder).map(([folder, filesInFolder]) => (
                  <div key={folder}>
                    {folder !== "root" && (
                      <div
                        className="flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                        onClick={() =>
                          setExpandedFolders((prev) => ({
                            ...prev,
                            [folder]: !prev[folder],
                          }))
                        }
                      >
                        {expandedFolders[folder] ?
                          <FolderOpen className="h-4 w-4 text-amber-500" />
                        : <Folder className="h-4 w-4 text-amber-500" />}
                        <span className="text-sm font-medium">{folder}</span>
                      </div>
                    )}

                    {(folder === "root" || expandedFolders[folder]) && (
                      <div className={folder !== "root" ? "ml-6 space-y-1" : "space-y-1"}>
                        {filesInFolder.map((file) => (
                          <div
                            key={file.id}
                            className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all duration-150 ${
                              selectedFile?.id === file.id ?
                                "bg-blue-100 text-blue-900 shadow-sm"
                              : "hover:bg-gray-100"
                            }`}
                            onClick={() => setSelectedFile(file)}
                          >
                            {getFileIcon(file)}
                            <span className="text-sm">{file.name}</span>
                            {formData.feedbacks.some(
                              (f) => f.fileRef === file.name || f.fileRef === file.path,
                            ) && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                {
                                  formData.feedbacks.filter(
                                    (f) =>
                                      f.fileRef === file.name || f.fileRef === file.path,
                                  ).length
                                }
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* File Viewer */}
          <div
            className="flex overflow-hidden"
            style={{
              height: showBottomPanel ? `calc(100% - ${bottomPanelHeight}px)` : "100%",
            }}
          >
            <div className="flex-1 overflow-hidden">
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

              <div className="p-4 overflow-auto h-full">{renderFileContent()}</div>
            </div>

            {/* Feedback Panel */}
            <div className="w-80 border-l overflow-y-auto">
              <div className="p-4">
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

                <div className="space-y-3">
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
                              {getFeedbackIcon(feedback.tag)}
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
                                </div>

                                {/* Only show lines for text feedback */}
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
            <>
              <div
                className={`h-1  hover:bg-blue-400 cursor-ns-resize transition-colors duration-200 ${
                  isResizing ? "bg-blue-500" : ""
                }`}
                onMouseDown={handleMouseDown}
              >
                <div className="h-full flex items-center justify-center">
                  <div className="w-12 h-0.5 bg-gray-400 rounded-full"></div>
                </div>
              </div>

              {/* Bottom Panel with Tabs (shadcn Tabs) */}
              <div
                className="border-t overflow-hidden flex flex-col"
                style={{ height: `${bottomPanelHeight}px` }}
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
                    {showScoringTab && (
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
                          const currentScore = formData.scoreBreakdowns.find(
                            (sb) => sb.criterionName === criterion.name,
                          );
                          const rawScore = currentScore?.rawScore || 0;
                          // Max points for this criterion
                          const criterionMaxPoints =
                            (scaleFactor * (criterion.weight ?? 0)) / 100;
                          // Points to display in input (always derive from formData)
                          const points = rawScore * (criterionMaxPoints / 100);
                          return (
                            <TabsContent
                              key={criterion.id}
                              value={criterion.name}
                              className="flex-1"
                            >
                              <Card className="flex-1">
                                <CardHeader className="pb-4">
                                  <CardTitle className="text-base justify-between flex items-center">
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {criterion.name} - {criterion.weight}%
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400">
                                          Custom Score:
                                        </span>
                                        <input
                                          type="number"
                                          min={0}
                                          max={criterionMaxPoints}
                                          step={0.5}
                                          value={
                                            currentScore ? Number(points.toFixed(2)) : ""
                                          }
                                          onChange={(e) => {
                                            console.log("Input changed:", e.target.value);
                                            const val = parseFloat(e.target.value);
                                            const maxPoints = criterionMaxPoints;
                                            if (isNaN(val) || e.target.value === "") {
                                              updateScore1(criterion.name, 0);
                                              return;
                                            }
                                            const clamped = Math.max(
                                              0,
                                              Math.min(val, maxPoints),
                                            );
                                            // Convert points to rawScore (0-scaleFactor)
                                            const newRaw =
                                              maxPoints > 0 ?
                                                (clamped / maxPoints) * scaleFactor * 10
                                              : 0;
                                            updateScore1(criterion.name, newRaw);
                                          }}
                                          className="w-20 rounded border border-gray-600 px-2 py-1 text-sm"
                                        />
                                        <span className="text-xs">
                                          / {criterionMaxPoints} points
                                        </span>
                                      </div>
                                    </span>
                                  </CardTitle>
                                  <CardDescription className="text-sm"></CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                  <div className="flex gap-4">
                                    {criterion.levels.map((level) => (
                                      <div key={level.tag} className="flex-1">
                                        <div className="text-center mb-2">
                                          <span className="text-xs text-gray-400">
                                            {level.weight}%
                                          </span>
                                        </div>
                                        <button
                                          onClick={() =>
                                            updateScore1(criterion.name, level.weight)
                                          }
                                          className={`w-full p-3 rounded text-center ${
                                            rawScore === level.weight ?
                                              "border-2 border-blue-400"
                                            : "border"
                                          }`}
                                        >
                                          <div className="text-xs">
                                            {level.description}
                                          </div>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          );
                        })}
                      </Tabs>
                    )}
                  </TabsContent>
                  <TabsContent value="summary" className="flex-1 overflow-auto px-4 pb-4">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Score Summary
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {rubric.criteria.map((criterion) => {
                          const currentScore = formData.scoreBreakdowns.find(
                            (sb) => sb.criterionName === criterion.name,
                          );
                          return (
                            <div key={criterion.id} className="rounded-lg border p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {criterion.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getTagColor(currentScore?.tag || "")}`}
                                  >
                                    {currentScore?.tag || "N/A"}
                                  </Badge>
                                </div>
                                <span className="text-sm font-medium">
                                  {/* Show actual score for this criterion (points) */}
                                  {currentScore ?
                                    (
                                      (currentScore.rawScore / scaleFactor) *
                                      (criterion.weight || 0)
                                    ).toFixed(2)
                                  : "0"}
                                  /
                                  {(
                                    (scaleFactor * (criterion.weight || 0)) /
                                    100
                                  ).toFixed(2)}
                                </span>
                              </div>
                              <Progress
                                value={
                                  currentScore?.rawScore ?
                                    (currentScore.rawScore / scaleFactor) * 100
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
                    {/* {activeTab === "tests" && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Test Results</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {assessment.testResults.map((testResult) => (
                            <div key={testResult.id} className="bg-white rounded-lg border p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{testResult.name}</span>
                                  {getTestStatusIcon(testResult.status)}
                                </div>
                                <span className="text-sm font-medium">
                                  {testResult.duration.toFixed(3)}s
                                </span>
                              </div>
                              {testResult.message && (
                                <div className="bg-red-100 rounded-lg p-3">
                                  <p className="text-xs text-red-800 leading-relaxed">
                                    {testResult.message}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )} */}
                  </TabsContent>
                  <TabsContent
                    value="overview"
                    className="flex-1 overflow-auto px-4 pb-4"
                  >
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
          )}
        </div>
      </div>
    </div>
  );
}
