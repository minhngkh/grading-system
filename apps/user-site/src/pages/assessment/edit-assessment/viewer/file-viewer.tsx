import React from "react";
import HighlightableViewer from "./code-viewer";
import PDFViewer from "./pdf-viewer";
import ImageViewer from "./image-viewer";
import { Assessment, FeedbackItem } from "@/types/assessment";
import { FileItem } from "@/types/file";

interface FileViewerProps {
  file: FileItem;
  activeFeedbackId?: number | null;
  onSelectionMade?: () => void;
  onPageSelect?: (page: number | null) => void;
  onSelectionChange?: (selection: any) => void;
  updateLastSavedData?: (updates: { feedbacks: FeedbackItem[] }) => void;
  assessment: Assessment;
  onUpdate: (updatedAssessment: Partial<Assessment>) => void;
  onUpdateLastSave: (updatedLastSaved: Partial<Assessment>) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({
  file,
  activeFeedbackId,
  onSelectionMade,
  onPageSelect,
  onSelectionChange,
  assessment,
  onUpdate,
  onUpdateLastSave,
}) => {
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
        file={file}
        activeFeedbackId={activeFeedbackId}
        onPageSelect={onPageSelect}
        assessment={assessment}
        onUpdate={onUpdate}
        onUpdateLastSave={onUpdateLastSave}
      />
    );
  } else if (file.type === "code" || file.type === "document" || file.type === "essay") {
    return (
      <HighlightableViewer
        file={file}
        activeFeedbackId={activeFeedbackId}
        onSelectionMade={onSelectionMade}
        onSelectionChange={onSelectionChange}
        assessment={assessment}
        onUpdate={onUpdate}
        onUpdateLastSave={onUpdateLastSave}
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
