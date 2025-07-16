import React from "react";
import HighlightableViewer from "./code-viewer";
import PDFViewer from "./pdf-viewer";
import ImageViewer from "./image-viewer";
import { FeedbackItem } from "@/types/assessment";
import { FileItem } from "@/types/file";

interface FileViewerProps {
  file: FileItem;
  feedbacks: FeedbackItem[];
  updateFeedback: (feedbackId: string, adjustedFeedback: FeedbackItem) => void;
  activeFeedbackId?: string | null;
  onSelectionMade?: () => void;
  onPageSelect?: (page: number | null) => void;
  onSelectionChange?: (selection: any) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({
  file,
  feedbacks,
  updateFeedback,
  activeFeedbackId,
  onSelectionMade,
  onPageSelect,
  onSelectionChange,
}) => {
  // Gộp logic xác định loại file
  if (file.type === "image") {
    return (
      <ImageViewer
        src={file.content}
        onSelectionMade={onSelectionMade}
        onSelectionChange={onSelectionChange}
      />
    );
  } else if (file.type === "pdf") {
    return (
      <PDFViewer
        fileUrl={file.content}
        feedbacks={feedbacks}
        updateFeedback={updateFeedback}
        activeFeedbackId={activeFeedbackId}
        onPageSelect={onPageSelect}
      />
    );
  } else if (file.type === "code" || file.type === "document" || file.type === "essay") {
    return (
      <HighlightableViewer
        file={file}
        feedbacks={feedbacks}
        updateFeedback={updateFeedback}
        activeFeedbackId={activeFeedbackId}
        onSelectionMade={onSelectionMade}
        onSelectionChange={onSelectionChange}
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
