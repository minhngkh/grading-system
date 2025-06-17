import React, { useState } from "react";
import HighlightableViewer from "./code-viewer";
import PDFViewer from "./pdf-view";
import { FeedbackItem } from "@/types/assessment";

// Import ImageHighlighter
import { ImageHighlighter } from "./image-highlighter";

interface FileViewerProps {
  fileType: string;
  fileUrl: string;
  feedbacks: FeedbackItem[];
  updateFeedback: (newFeedbacks: FeedbackItem[]) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  activeFeedbackId?: string | null;
  imageHighlights?: any[]; // Thêm prop này nếu cần thiết
  onImageHighlightsChange?: (highlights: any[]) => void; // Thêm prop này nếu cần thiết
  rubricCriteria?: string[]; // Add this prop for criteria options
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
];

const FileViewer: React.FC<FileViewerProps> = ({
  fileType,
  fileUrl,
  feedbacks,
  updateFeedback,
  isHighlightMode,
  onHighlightComplete,
  activeFeedbackId,
  rubricCriteria = [],
}) => {
  if (imageExtensions.includes(fileType)) {
    return (
      <div className="flex justify-center items-center h-full">
        <ImageHighlighter
          imageUrl={fileUrl}
          feedbacks={feedbacks.filter(
            (fb) => fb.fileRef === (fileUrl ? fileUrl.split("/").pop() : ""),
          )}
          updateFeedback={updateFeedback}
          isHighlightMode={isHighlightMode}
          onHighlightComplete={onHighlightComplete}
          activeFeedbackId={activeFeedbackId}
          fileRef={fileUrl ? fileUrl.split("/").pop() : ""}
          rubricCriteria={rubricCriteria}
        />
      </div>
    );
  }
  if (pdfExtensions.includes(fileType)) {
    return <PDFViewer fileUrl={fileUrl} />;
  }
  if (textExtensions.includes(fileType)) {
    const viewerType = fileType === "txt" ? "essay" : "code";
    // Không filter lại feedbacks ở đây, chỉ truyền nguyên vẹn từ props
    return (
      <HighlightableViewer
        type={viewerType}
        fileUrl={fileUrl}
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
