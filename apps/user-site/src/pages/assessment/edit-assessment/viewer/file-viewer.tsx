import React from "react";
import HighlightableViewer from "./code-viewer";
import PDFViewer from "./pdf-view";
import ImageViewer from "./image-highlighter";
import { FeedbackItem } from "@/types/assessment";
import { FileItem } from "@/types/file";

interface FileViewerProps {
  file: FileItem;
  feedbacks: FeedbackItem[];
  feedbacksAll: FeedbackItem[];
  updateFeedback: (newFeedbacks: FeedbackItem[]) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  activeFeedbackId?: string | null;
  rubricCriteria?: string[];
}

const FileViewer: React.FC<FileViewerProps> = ({
  file,
  feedbacks,
  feedbacksAll,
  updateFeedback,
  isHighlightMode,
  onHighlightComplete,
  activeFeedbackId,
  rubricCriteria = [],
}) => {
  // Gộp logic xác định loại file
  if (file.type === "image") {
    return <ImageViewer src={file.content} />;
  }
  if (file.type === "pdf") {
    return <PDFViewer fileUrl={file.content} />;
  }
  if (file.type === "code" || file.type === "document" || file.type === "essay") {
    return (
      <HighlightableViewer
        file={file}
        feedbacks={feedbacks}
        feedbacksAll={feedbacksAll}
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
