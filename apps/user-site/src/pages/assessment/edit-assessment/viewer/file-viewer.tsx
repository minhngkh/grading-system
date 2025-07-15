import React from "react";
import HighlightableViewer from "./code-viewer";
import PDFViewer from "./pdf-viewer";
import ImageViewer from "./image-viewer";
import { FeedbackItem, Assessment, LocationData } from "@/types/assessment";
import { FileItem } from "@/types/file";
import { UseFormReturn } from "react-hook-form";

interface FileViewerProps {
  file: FileItem;
  feedbacks: FeedbackItem[];
  addFeedback: (newFeedback: FeedbackItem) => void;
  updateFeedback: (feedbackId: string, adjustedFeedback: FeedbackItem) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  activeFeedbackId?: string | null;
  rubricCriteria?: string[];
  gradingId: string;
  submissionReference: string;
  onSelectionMade?: () => void;
  onPageSelect?: (page: number | null) => void;
  onSelectionChange?: (selection: any) => void;
  locationData?: LocationData;
  form: UseFormReturn<Assessment>;
}

const FileViewer: React.FC<FileViewerProps> = ({
  file,
  feedbacks,
  addFeedback,
  updateFeedback,

  isHighlightMode,
  onHighlightComplete,
  activeFeedbackId,
  rubricCriteria = [],
  gradingId,
  onSelectionMade,
  onPageSelect,
  onSelectionChange,
  locationData,
  form,
}) => {
  // Gộp logic xác định loại file
  if (file.type === "image") {
    return (
      <ImageViewer
        src={file.content}
        file={file}
        addFeedback={addFeedback}
        isHighlightMode={isHighlightMode}
        onHighlightComplete={onHighlightComplete}
        rubricCriteria={rubricCriteria}
        gradingId={gradingId}
        submissionReference={form.getValues().submissionReference}
      />
    );
  }
  if (file.type === "pdf") {
    return (
      <PDFViewer
        fileUrl={file.content}
        feedbacks={feedbacks}
        updateFeedback={updateFeedback}
        activeFeedbackId={activeFeedbackId}
        onPageSelect={onPageSelect}
      />
    );
  }
  if (file.type === "code" || file.type === "document" || file.type === "essay") {
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
