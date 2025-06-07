"use client";

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
} from "lucide-react";
import { Assessment, FeedbackItem, ScoreBreakdown } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import FileViewer from "./viewer/file-viewer";
import ExportDialog from "@/pages/review/manual-grade/export-dialog";

// Mock UI Components - tất cả được định nghĩa trong file này
const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  onClick,
  ...props
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-500",
  };
  const sizeClasses = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}) => {
  const baseClasses =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    outline: "border border-gray-200 text-gray-700",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Progress = ({ value, className = "" }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full ${className}`}>
    <div
      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const Card = ({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <div
    className={`rounded-xl border bg-white text-gray-950 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const CardHeader = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;

const CardTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;

const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

const Select = ({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
}) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
  >
    {children}
  </select>
);

const SelectItem = ({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) => <option value={value}>{children}</option>;

export function RubricAssessmentUI({
  assessment,
  rubric,
}: {
  assessment: Assessment;
  rubric: Rubric;
}) {
  const [blobFiles, setBlobFiles] = useState<string[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(assessment.feedbacks);
  const [scoreBreakdowns, setScoreBreakdowns] = useState<ScoreBreakdown[]>(
    assessment.scoreBreakdowns,
  );
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
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

  // Fetch blob list
  useEffect(() => {
    async function fetchBlobList() {
      try {
        const prefix =
          assessment.submissionReference.endsWith("/") ?
            assessment.submissionReference
          : assessment.submissionReference + "/";
        const response = await fetch(
          `http://127.0.0.1:51701/devstoreaccount1/submissions-store?restype=container&comp=list&prefix=${prefix}`,
        );
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");
        const blobs = Array.from(xmlDoc.getElementsByTagName("Blob"))
          .map((blob) => blob.getElementsByTagName("Name")[0]?.textContent || "")
          .filter(Boolean);
        setBlobFiles(blobs);
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
              const url = `http://127.0.0.1:51701/devstoreaccount1/submissions-store/${blob}`;
              const res = await fetch(url);
              content = await res.text();
            } catch {
              content = "// Cannot load file content";
            }
          }
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

  const totalScore = scoreBreakdowns.reduce((sum, breakdown) => {
    const criterion = rubric.criteria.find((c) => c.name === breakdown.criterionName);
    const weight = criterion?.weight || 0;
    return sum + (breakdown.rawScore * weight) / 100;
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
  const handleFeedbackClick = (feedback: FeedbackItem) => {
    if (selectedFeedback?.id === feedback.id) {
      setSelectedFeedback(null);
      setHighlightedLines([]);
      return;
    }
    setSelectedFeedback(feedback);
    if (feedback.type === "text") {
      const lines = [];
      for (let i = feedback.fromLine; i <= feedback.toLine; i++) {
        lines.push(i);
      }
      setHighlightedLines(lines);

      // Switch to the file referenced in feedback
      const file = files.find(
        (f) => f.name === feedback.fileRef || f.path === feedback.fileRef,
      );
      if (file) {
        setSelectedFile(file);
      }
    } else {
      setHighlightedLines([]);
    }
  };

  // Update score for criterion
  const updateScore = (criterionName: string, newTag: string) => {
    const criterion = rubric.criteria.find((c) => c.name === criterionName);
    const level = criterion?.levels.find((l) => l.tag === newTag);

    if (level) {
      setScoreBreakdowns((prev) =>
        prev.map((sb) =>
          sb.criterionName === criterionName ?
            { ...sb, tag: newTag, rawScore: level.weight }
          : sb,
        ),
      );
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
    setHighlightedLines([]);
  };

  // Update feedbacks from child viewer
  const handleUpdateFeedback = (newFeedbacks: FeedbackItem[]) => {
    // Chỉ thêm feedback mới chưa có id trùng (hoặc comment trùng) vào feedbacks hiện tại
    if (!selectedFile) return;
    const fileName = selectedFile.name;
    const filtered = newFeedbacks.filter((fb) => fb.fileRef === fileName);

    setFeedbacks((prev) => {
      // Loại bỏ feedback đã có id trùng (hoặc comment trùng) với feedback mới
      const newIds = new Set(filtered.map((fb) => fb.id || fb.comment));
      const deduped = prev.filter(
        (fb) => !(fb.fileRef === fileName && newIds.has(fb.id || fb.comment)),
      );
      return [...deduped, ...filtered];
    });
  };

  // Render file content with line numbers and highlights
  const renderFileContent = () => {
    if (!selectedFile) return <div className="text-gray-400 p-8">No file selected</div>;
    // Chỉ truyền feedbacks của file hiện tại cho FileViewer
    const fileUrl = `http://127.0.0.1:51701/devstoreaccount1/submissions-store/${selectedFile.blobPath}`;
    const ext = getFileExtension(selectedFile.name);
    const fileName = selectedFile.name;
    const fileFeedbacks = feedbacks.filter((fb) => fb.fileRef === fileName);
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
        activeFeedbackId={selectedFeedback?.id}
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
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
              <h1 className="text-xl font-bold">Rubric Assessment</h1>
              <p className="text-sm text-gray-500">
                {rubric.rubricName} • Total Score: {totalScore.toFixed(1)}/100
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBottomPanel((v) => !v)}
            >
              {showBottomPanel ? "Hide Scoring" : "Show Scoring"}
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <ExportDialog assessmentData={assessment} />
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
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Project Files</h3>
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
                            {feedbacks.some(
                              (f) => f.fileRef === file.name || f.fileRef === file.path,
                            ) && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                {
                                  feedbacks.filter(
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
            <div className="flex-1 bg-white overflow-hidden">
              <div className="p-4 border-b border-gray-200">
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
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Feedback (
                  {selectedFile ?
                    feedbacks.filter(
                      (f) =>
                        f.fileRef === selectedFile.name ||
                        f.fileRef === selectedFile.path,
                    ).length
                  : 0}
                  )
                </h3>

                <div className="space-y-3">
                  {selectedFile &&
                    feedbacks
                      .filter(
                        (feedback) =>
                          feedback.fileRef === selectedFile.name ||
                          feedback.fileRef === selectedFile.path,
                      )
                      .map((feedback) => (
                        <Card
                          key={feedback.id}
                          className={`cursor-pointer transition-all pt-1 duration-200 ${
                            selectedFeedback?.id === feedback.id ?
                              "ring-2 ring-blue-500 shadow-md"
                            : "hover:shadow-md"
                          }`}
                          onClick={() => handleFeedbackClick(feedback)}
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
                                    variant="outline"
                                    className={`text-xs ${getTagColor(feedback.tag)}`}
                                  >
                                    {feedback.tag}
                                  </Badge>
                                </div>

                                {/* Only show lines for text feedback */}
                                {feedback.type === "text" && (
                                  <div className="text-xs text-gray-500 mb-1">
                                    Lines {feedback.fromLine}-{feedback.toLine}
                                  </div>
                                )}

                                <p className="text-sm text-gray-900">
                                  {feedback.comment}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                  {(!selectedFile ||
                    feedbacks.filter(
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
                className={`h-1 bg-gray-200 hover:bg-blue-400 cursor-ns-resize transition-colors duration-200 ${
                  isResizing ? "bg-blue-500" : ""
                }`}
                onMouseDown={handleMouseDown}
              >
                <div className="h-full flex items-center justify-center">
                  <div className="w-12 h-0.5 bg-gray-400 rounded-full"></div>
                </div>
              </div>

              {/* Bottom Panel with Tabs */}
              <div
                className="bg-white border-t border-gray-200 overflow-hidden flex flex-col"
                style={{ height: `${bottomPanelHeight}px` }}
              >
                <div className="p-4 flex-shrink-0">
                  <div className="inline-flex h-12 items-center justify-center rounded-xl bg-gray-100 p-1 text-gray-500 mb-4">
                    <button
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        activeTab === "scoring" ?
                          "bg-white text-gray-950 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                      }`}
                      onClick={() => setActiveTab("scoring")}
                    >
                      Rubric Scoring
                    </button>
                    <button
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        activeTab === "summary" ?
                          "bg-white text-gray-950 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                      }`}
                      onClick={() => setActiveTab("summary")}
                    >
                      Score Summary
                    </button>
                    <button
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        activeTab === "tests" ?
                          "bg-white text-gray-950 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                      }`}
                      onClick={() => setActiveTab("tests")}
                    >
                      Test Results
                    </button>
                    <button
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        activeTab === "overview" ?
                          "bg-white text-gray-950 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                      }`}
                      onClick={() => setActiveTab("overview")}
                    >
                      Feedback Overview
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto px-4 pb-4">
                  {activeTab === "scoring" && showScoringTab && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                      {rubric.criteria.map((criterion) => {
                        const currentScore = scoreBreakdowns.find(
                          (sb) => sb.criterionName === criterion.name,
                        );

                        return (
                          <Card
                            key={criterion.id}
                            className="hover:shadow-lg transition-all duration-300"
                          >
                            <CardHeader className="pb-4">
                              <CardTitle className="text-base">
                                {criterion.name}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                Weight: {criterion.weight}%
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Quick Level Selection */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">
                                  Quick Select Level:
                                </label>
                                <Select
                                  value={currentScore?.tag || ""}
                                  onValueChange={(value) =>
                                    updateScore(criterion.name, value)
                                  }
                                >
                                  <option value="">Select level</option>
                                  {criterion.levels.map((level) => (
                                    <SelectItem key={level.tag} value={level.tag}>
                                      {level.tag} ({level.weight}%)
                                    </SelectItem>
                                  ))}
                                </Select>
                              </div>

                              {/* Score Slider */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">
                                  Adjust with Slider:
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={currentScore?.rawScore || 0}
                                  onChange={(e) => {
                                    const newScore = Number.parseInt(e.target.value);
                                    const matchingLevel = criterion.levels.find(
                                      (l) => l.weight === newScore,
                                    );
                                    const tag =
                                      matchingLevel ? matchingLevel.tag : "Custom";

                                    setScoreBreakdowns((prev) =>
                                      prev.map((sb) =>
                                        sb.criterionName === criterion.name ?
                                          { ...sb, rawScore: newScore, tag }
                                        : sb,
                                      ),
                                    );
                                  }}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                  style={{
                                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${currentScore?.rawScore || 0}%, #e5e7eb ${currentScore?.rawScore || 0}%, #e5e7eb 100%)`,
                                  }}
                                />
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>0</span>
                                  <span>25</span>
                                  <span>50</span>
                                  <span>75</span>
                                  <span>100</span>
                                </div>
                              </div>

                              {/* Level Indicators */}
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600">
                                  Level Indicators:
                                </label>
                                <div className="grid grid-cols-2 gap-1">
                                  {criterion.levels.map((level) => (
                                    <button
                                      key={level.tag}
                                      onClick={() =>
                                        updateScore(criterion.name, level.tag)
                                      }
                                      className={`text-xs px-2 py-1 rounded-md border transition-all duration-200 ${
                                        currentScore?.rawScore === level.weight ?
                                          "bg-blue-100 border-blue-300 text-blue-800"
                                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                      }`}
                                    >
                                      {level.weight}%
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {currentScore && (
                                <div className="space-y-3 pt-2 border-t border-gray-100">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Final Score</span>
                                    <span className="font-semibold text-gray-900">
                                      {(
                                        (currentScore.rawScore *
                                          (criterion.weight || 0)) /
                                        100
                                      ).toFixed(1)}
                                      /{criterion.weight}
                                    </span>
                                  </div>
                                  <Progress
                                    value={currentScore.rawScore}
                                    className="h-2.5"
                                  />

                                  {/* Current Level Description */}
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${getTagColor(currentScore.tag)}`}
                                      >
                                        {currentScore.tag}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        ({currentScore.rawScore}%)
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                      {currentScore.tag === "Custom" ?
                                        "Custom score - manually adjusted"
                                      : criterion.levels.find(
                                          (l) => l.tag === currentScore.tag,
                                        )?.description
                                      }
                                    </p>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  {activeTab === "summary" && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900">Score Summary</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {rubric.criteria.map((criterion) => {
                          const currentScore = scoreBreakdowns.find(
                            (sb) => sb.criterionName === criterion.name,
                          );
                          return (
                            <div
                              key={criterion.id}
                              className="bg-white rounded-lg border p-4"
                            >
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
                                  {((currentScore?.rawScore || 0) *
                                    (criterion.weight || 0)) /
                                    100}
                                  /{criterion.weight}
                                </span>
                              </div>
                              <Progress
                                value={currentScore?.rawScore || 0}
                                className="h-2.5"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Feedback Overview
                      </h3>
                      <div className="bg-white rounded-lg border p-4">
                        <div dangerouslySetInnerHTML={{ __html: feedbackOverview }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
