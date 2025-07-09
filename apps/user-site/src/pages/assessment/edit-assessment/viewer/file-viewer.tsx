import React from "react";
import HighlightableViewer from "./code-viewer";
import PDFViewer from "./pdf-viewer";
import ImageViewer from "./image-viewer";
import { FeedbackItem } from "@/types/assessment";
import { FileItem } from "@/types/file";

interface FileViewerProps {
  file: FileItem;
  feedbacks: FeedbackItem[];
  feedbacksAll: FeedbackItem[];
  addFeedback: (newFeedback: FeedbackItem) => void;
  updateFeedback: (index: number, adjustedFeedback: FeedbackItem) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  activeFeedbackId?: string | null;
  rubricCriteria?: string[];
  gradingId: string;
  submissionReference: string;
  onFeedbackValidated?: (validatedFeedbacks: FeedbackItem[]) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({
  file,
  feedbacks,
  feedbacksAll,
  addFeedback,
  updateFeedback,
  isHighlightMode,
  onHighlightComplete,
  activeFeedbackId,
  rubricCriteria = [],
  gradingId,
  submissionReference,
  onFeedbackValidated,
}) => {
  // Gộp logic xác định loại file
  if (file.type === "image") {
    return (
      <ImageViewer
        src={file.content}
        file={file}
        addFeedback={addFeedback}
        // updateFeedback={updateFeedback}
        isHighlightMode={isHighlightMode}
        onHighlightComplete={onHighlightComplete}
        rubricCriteria={rubricCriteria}
        gradingId={gradingId}
        submissionReference={submissionReference}
      />
    );
  }
  if (file.type === "pdf") {
    return (
      <PDFViewer
        fileUrl={file.content}
        file={file}
        feedbacks={feedbacks}
        feedbacksAll={feedbacksAll}
        addFeedback={addFeedback}
        updateFeedback={updateFeedback}
        isHighlightMode={isHighlightMode}
        onHighlightComplete={onHighlightComplete}
        rubricCriteria={rubricCriteria}
        gradingId={gradingId}
        submissionReference={submissionReference}
        activeFeedbackId={activeFeedbackId} // truyền activeFeedbackId
        onFeedbackValidated={onFeedbackValidated}
      />
    );
  }
  if (file.type === "code" || file.type === "document" || file.type === "essay") {
    return (
      <HighlightableViewer
        file={file}
        feedbacks={feedbacks}
        feedbacksAll={feedbacksAll}
        addFeedback={addFeedback}
        updateFeedback={updateFeedback}
        isHighlightMode={isHighlightMode}
        onHighlightComplete={onHighlightComplete}
        activeFeedbackId={activeFeedbackId}
        rubricCriteria={rubricCriteria}
        gradingId={gradingId}
        submissionReference={submissionReference}
        onFeedbackValidated={onFeedbackValidated}
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
