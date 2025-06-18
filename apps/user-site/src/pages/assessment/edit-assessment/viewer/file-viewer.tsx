import React from "react";
import HighlightableViewer from "./code-viewer";
import PDFViewer from "./pdf-view";
import { FeedbackItem } from "@/types/assessment";

interface FileViewerProps {
  fileType: string;
  fileUrl: string;
  content?: string; // Thêm content
  feedbacks: FeedbackItem[];
  updateFeedback: (newFeedbacks: FeedbackItem[]) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  activeFeedbackId?: string | null;
  imageHighlights?: any[];
  onImageHighlightsChange?: (highlights: any[]) => void;
  rubricCriteria?: string[];
}

const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
const pdfExtensions = ["pdf"];
const textExtensions = [
  "txt",
  "md",
  "js",
  "ts",
  "tsx",
  "jsx",
  "json",
  "css",
  "scss",
  "html",
  "c",
  "cpp",
  "java",
  "py",
  "go",
  "rs",
  "php",
  "rb",
  "cs",
  "swift",
  "kt",
  "h",
];

const FileViewer: React.FC<FileViewerProps> = ({
  fileType,
  fileUrl,
  content,
  feedbacks,
  updateFeedback,
  isHighlightMode,
  onHighlightComplete,
  activeFeedbackId,
  rubricCriteria = [],
}) => {
  if (imageExtensions.includes(fileType)) {
    // Xây dựng URL đầy đủ cho blob image
    const fullImageUrl =
      fileUrl.startsWith("http") ? fileUrl : (
        `http://127.0.0.1:27000/devstoreaccount1/submissions-store/${fileUrl}`
      );
    return (
      <div className="flex justify-center items-center h-full">
        <img src={fullImageUrl} alt={fileUrl} />
      </div>
    );
  }
  if (pdfExtensions.includes(fileType)) {
    return <PDFViewer fileUrl={fileUrl} />;
  }
  if (textExtensions.includes(fileType)) {
    const viewerType = fileType === "txt" ? "essay" : "code";
    return (
      <HighlightableViewer
        type={viewerType}
        fileUrl={fileUrl}
        content={content ?? ""}
        feedbacks={feedbacks}
        updateFeedback={updateFeedback}
        isHighlightMode={isHighlightMode}
        onHighlightComplete={onHighlightComplete}
        activeFeedbackId={activeFeedbackId}
        rubricCriteria={rubricCriteria}
      />
    );
  }
  return (
    <div className="flex justify-center items-center h-full text-gray-500">
      File type not supported for preview.
    </div>
  );
};

export default FileViewer;
