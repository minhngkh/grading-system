import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
import { FileIcon, Highlighter, MessageSquare, Trash2 } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Assessment } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import FileViewer from "./viewer/file-viewer";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  File as FileIcon2,
  Folder as FolderIcon,
  Menu,
} from "lucide-react";

export interface AssignmentViewerProps {
  assessment: Assessment;
  setAssessment: React.Dispatch<React.SetStateAction<Assessment>>;
  rubric: Rubric;
}

const AssignmentViewer = ({
  assessment,
  setAssessment,
  rubric,
}: AssignmentViewerProps) => {
  const [blobFiles, setBlobFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("submission");
  // Initial selectedFile là file đầu tiên từ blobFiles hoặc feedbacks
  const [selectedFile, setSelectedFile] = useState(() => {
    if (blobFiles.length > 0) {
      return blobFiles[0].replace(/^grading-d4cdfc8e-a0dd-08dd-2002-6efb188bc9c9\//, "");
    }
    const fbFiles = Array.from(new Set(assessment.feedbacks.map((fb) => fb.fileRef)));
    return fbFiles.length > 0 ? fbFiles[0] : "";
  });
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [showExplorer, setShowExplorer] = useState(true);

  useEffect(() => {
    async function fetchBlobList() {
      try {
        const prefix =
          assessment.submissionReference.endsWith("/") ?
            assessment.submissionReference
          : assessment.submissionReference + "/";
        const response = await fetch(
          `http://127.0.0.1:50221/devstoreaccount1/submissions-store?restype=container&comp=list&prefix=${prefix}`,
        );
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");
        const blobs = Array.from(xmlDoc.getElementsByTagName("Blob"))
          .map((blob) => blob.getElementsByTagName("Name")[0]?.textContent || "")
          .filter(Boolean);
        setBlobFiles(blobs);
        if (blobs.length > 0 && !selectedFile) {
          setSelectedFile(blobs[0].replace(new RegExp(`^${prefix}`), ""));
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách blobs:", error);
      }
    }
    fetchBlobList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment.submissionReference]);

  // Lấy tất cả file từ blob container (không chỉ file có feedback)
  const prefix =
    assessment.submissionReference.endsWith("/") ?
      assessment.submissionReference
    : assessment.submissionReference + "/";
  const files =
    blobFiles.length > 0 ?
      blobFiles.map((name) => name.replace(new RegExp(`^${prefix}`), ""))
    : [];

  // Build file tree for explorer
  const fileTree = buildFileTree(files);

  useEffect(() => {
    if (files.length > 0 && !files.includes(selectedFile)) {
      setSelectedFile(files[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const selectedFileFeedbacks = useMemo(
    () => assessment.feedbacks.filter((fb) => fb.fileRef === selectedFile),
    [assessment.feedbacks, selectedFile],
  );

  const fileType = selectedFile.split(".").pop()?.toLowerCase() || "";

  const handleFeedbackUpdate = (newFeedbacks: any[]) => {
    if (!newFeedbacks.length) return;
    const fileRef = newFeedbacks[0].fileRef;
    setAssessment((prev) => ({
      ...prev,
      feedbacks: [
        ...prev.feedbacks.filter((fb) => fb.fileRef !== fileRef),
        ...prev.feedbacks
          .filter((fb) => fb.fileRef === fileRef)
          .filter(
            (fb) =>
              !newFeedbacks.some((nf) => (nf.id || nf.comment) === (fb.id || fb.comment)),
          ),
        ...newFeedbacks,
      ],
    }));
  };

  const toggleHighlightMode = () => setIsHighlightMode((prev) => !prev);

  const handleFeedbackClick = (feedbackId: string) => {
    setActiveFeedbackId((prev) => (prev === feedbackId ? null : feedbackId));
  };

  const handleDeleteFeedback = (feedbackId: string) => {
    setAssessment((prev) => ({
      ...prev,
      feedbacks: prev.feedbacks.filter((fb) => fb.id !== feedbackId),
    }));
    if (activeFeedbackId === feedbackId) setActiveFeedbackId(null);
  };

  const getBadgeClass = (tag: string | undefined) => {
    switch (tag) {
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200";
      case "notice":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200";
      case "tip":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200";
      case "caution":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const fullFileUrl =
    selectedFile ?
      `http://127.0.0.1:50221/devstoreaccount1/submissions-store/${prefix}${selectedFile}`
    : "";

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="flex border-b w-full">
        <TabsTrigger value="submission" className="p-2 flex-1 cursor-pointer">
          Submission
        </TabsTrigger>
        <TabsTrigger value="feedback" className="p-2 flex-1 cursor-pointer">
          Feedback Overview
        </TabsTrigger>
      </TabsList>
      <div className="flex relative">
        {/* --- FILE EXPLORER --- */}
        <div
          className={`transition-all duration-200 ${
            showExplorer ?
              "w-[48px] sm:w-[140px] md:w-[180px] lg:w-[200px] xl:w-[220px] 2xl:w-[240px] min-w-[48px] max-w-[240px]"
            : "w-[0px] min-w-0 max-w-0"
          } border-r bg-muted/40 h-[80vh] overflow-y-auto relative`}
        >
          {showExplorer && (
            <>
              <button
                className="absolute top-2 right-2 z-10 bg-white/80 rounded p-1 border hover:bg-accent"
                style={{ right: 8 }}
                onClick={() => setShowExplorer(false)}
                title="Hide Explorer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="font-semibold px-3 py-2 border-b text-xs text-gray-500 uppercase tracking-wider bg-muted/60">
                File Explorer
              </div>
              <FileTree
                tree={fileTree}
                selectedFile={selectedFile}
                onSelect={setSelectedFile}
              />
            </>
          )}
        </div>
        {/* --- Bật explorer lại --- */}
        {!showExplorer && (
          <button
            className="absolute left-0 top-4 z-30 bg-white/80 rounded-r p-1 border border-l-0 hover:bg-accent"
            style={{ marginLeft: 0 }}
            onClick={() => setShowExplorer(true)}
            title="Show Explorer"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        {/* --- MAIN CONTENT --- */}
        <div
          className="flex-1 flex flex-col px-3"
          style={{
            width: showExplorer ? "80%" : "100%",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          <TabsContent
            value="submission"
            className="border rounded shadow min-h-[40vh] flex min-w-0 max-w-full"
          >
            {/* Xóa DropdownMenu file, chỉ giữ viewer */}
            <div className="flex-1 min-w-0 max-w-full flex flex-col">
              <FileViewer
                fileType={fileType}
                fileUrl={fullFileUrl}
                feedbacks={selectedFileFeedbacks}
                updateFeedback={handleFeedbackUpdate}
                isHighlightMode={isHighlightMode}
                onHighlightComplete={() => setIsHighlightMode(false)}
                activeFeedbackId={activeFeedbackId}
              />
            </div>
            {/* ...existing feedback sidebar... */}
            <div className="w-1/4 my-3 px-3">
              <div className="flex gap-4 justify-between items-center">
                <strong>Feedback</strong>
                <Button
                  className="gap-2"
                  variant={isHighlightMode ? "default" : "outline"}
                  onClick={toggleHighlightMode}
                >
                  <Highlighter className="w-4 h-4" />
                  {isHighlightMode ? "Exit Highlight" : "Add Highlight"}
                </Button>
              </div>
              <p className="mt-3 text-sm font-semibold">
                All Feedbacks ({selectedFileFeedbacks.length})
              </p>
              <div className="space-y-2 max-h-[46vh] overflow-y-auto">
                {(
                  assessment.feedbacks.filter((fb) => fb.fileRef === selectedFile)
                    .length > 0
                ) ?
                  assessment.feedbacks
                    .filter((fb) => fb.fileRef === selectedFile)
                    .map((feedback, idx) => (
                      <div
                        key={feedback.id || idx}
                        className={`flex p-2 rounded-md cursor-pointer text-sm gap-1 items-start ${
                          activeFeedbackId === (feedback.id || feedback.comment) ?
                            "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                        }`}
                        onClick={() =>
                          handleFeedbackClick(feedback.id || feedback.comment)
                        }
                      >
                        <MessageSquare className="w-4 h-4 mt-1.25 mr-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {feedback.type === "text" ?
                            <p className="text-sm font-medium">
                              Lines {feedback.fromLine + 1}-{feedback.toLine + 1}
                            </p>
                          : feedback.type === "image" ?
                            <p className="text-sm font-medium">
                              Area: ({Math.round(feedback.x)}, {Math.round(feedback.y)})
                            </p>
                          : feedback.type === "pdf" ?
                            <p className="text-sm font-medium">Page {feedback.page}</p>
                          : null}
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {feedback.comment}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`px-2 py-1 text-xs font-semibold rounded ${getBadgeClass(
                            feedback.tag,
                          )}`}
                        >
                          {feedback.tag}
                        </Badge>
                        <Trash2
                          className="w-4 h-4 mt-1 text-gray-500 hover:text-red-500 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFeedback(feedback.id || feedback.comment);
                          }}
                        />
                      </div>
                    ))
                : <p className="text-sm text-gray-500">No feedback available.</p>}
              </div>
            </div>
          </TabsContent>
          <TabsContent
            value="feedback"
            className="p-2 border rounded shadow h-[51vh] overflow-auto"
          >
            <div className="space-y-4">
              {rubric.criteria.map((criterion) => (
                <div className="space-y-2" key={criterion.name}>
                  <div>
                    <strong>Criterion:</strong> {criterion.name}
                  </div>
                  <div>
                    <strong>Feedback:</strong>
                    <ul className="list-disc ml-4">
                      {assessment.feedbacks
                        .filter((fb) => fb.criterion === criterion.name)
                        .map((fb, idx) => (
                          <li key={fb.comment + idx}>
                            {fb.comment}{" "}
                            <Badge
                              variant="outline"
                              className={`ml-2 ${getBadgeClass(fb.tag)}`}
                            >
                              {fb.tag}
                            </Badge>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </div>
      </div>
      {/* <PDFViewer /> */}
    </Tabs>
  );
};

// Helper: Convert flat blob paths to tree
function buildFileTree(paths: string[]) {
  const root: any = {};
  for (const path of paths) {
    const parts = path.split("/");
    let node = root;
    for (let i = 0; i < parts.length; ++i) {
      const part = parts[i];
      if (!node[part]) {
        node[part] = i === parts.length - 1 ? null : {};
      }
      node = node[part];
    }
  }
  return root;
}

function FileTree({
  tree,
  pathPrefix = "",
  selectedFile,
  onSelect,
  level = 0,
}: {
  tree: any;
  pathPrefix?: string;
  selectedFile: string;
  onSelect: (file: string) => void;
  level?: number;
}) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  return (
    <ul className="pl-2">
      {Object.entries(tree).map(([name, value]) => {
        const fullPath = pathPrefix ? `${pathPrefix}/${name}` : name;
        if (value === null) {
          // File
          return (
            <li
              key={fullPath}
              className={`flex items-center cursor-pointer px-1 py-0.5 rounded ${selectedFile === fullPath ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
              style={{ paddingLeft: 8 + level * 12 }}
              onClick={() => onSelect(fullPath)}
            >
              <FileIcon className="w-4 h-4 mr-1" />
              <span className="truncate">{name}</span>
            </li>
          );
        } else {
          // Folder
          const isOpen = openFolders[fullPath] ?? true;
          return (
            <li key={fullPath}>
              <div
                className="flex items-center cursor-pointer px-1 py-0.5 rounded hover:bg-muted"
                style={{ paddingLeft: 8 + level * 12 }}
                onClick={() =>
                  setOpenFolders((prev) => ({
                    ...prev,
                    [fullPath]: !isOpen,
                  }))
                }
              >
                {isOpen ?
                  <ChevronDown className="w-4 h-4 mr-1" />
                : <ChevronRight className="w-4 h-4 mr-1" />}
                <FileIcon className="w-4 h-4 mr-1" />
                <span className="truncate font-semibold">{name}</span>
              </div>
              {isOpen && (
                <FileTree
                  tree={value}
                  pathPrefix={fullPath}
                  selectedFile={selectedFile}
                  onSelect={onSelect}
                  level={level + 1}
                />
              )}
            </li>
          );
        }
      })}
    </ul>
  );
}

export default AssignmentViewer;
