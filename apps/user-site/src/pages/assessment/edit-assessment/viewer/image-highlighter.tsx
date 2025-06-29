import React, { useState, useEffect } from "react";
import { FeedbackItem } from "@/types/assessment";
import { FileItem } from "@/types/file";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
  src: string;
  file: FileItem;
  feedbacksAll: FeedbackItem[];
  updateFeedback: (newFeedbacks: FeedbackItem[]) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  rubricCriteria?: string[];
  gradingId: string;
  submissionReference: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  file,
  updateFeedback,
  isHighlightMode,
  onHighlightComplete,
  rubricCriteria = [],
  gradingId,
  submissionReference,
}) => {
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newFeedbackTag, setNewFeedbackTag] = useState<string>("info");
  const [newCriterion, setNewCriterion] = useState<string>("");

  // Function to handle adding feedback for image
  const addFeedback = () => {
    if (!newComment.trim() || !newCriterion) return;

    // Format fileRef with gradingId and file.relativePath
    let fileRef = `${gradingId}/${submissionReference}/${file.relativePath || ""}`;

    const newFeedback: FeedbackItem = {
      criterion: newCriterion,
      fileRef,
      comment: newComment.trim(),
      tag: newFeedbackTag,
      locationData: {
        type: "image",
      },
    };

    updateFeedback([newFeedback]);
    setNewComment("");
    setNewFeedbackTag("info");
    setNewCriterion("");
    setIsDialogOpen(false);
    onHighlightComplete();
  };

  // Show dialog automatically when isHighlightMode is true
  useEffect(() => {
    if (isHighlightMode) setIsDialogOpen(true);
    else setIsDialogOpen(false);
  }, [isHighlightMode]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewComment("");
    setNewFeedbackTag("info");
    setNewCriterion("");
    if (onHighlightComplete) onHighlightComplete();
  };

  // When in highlight mode, clicking the image opens the feedback dialog
  const handleImageClick = () => {
    setOpen(true);
  };
  console.log(open, "Image viewer open state");
  return (
    <>
      <div
        className={`flex justify-center items-center w-full`}
        onClick={handleImageClick}
      >
        <img src={src} />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setOpen(false)}
        >
          <img
            src={src}
            style={{
              maxWidth: "96vw",
              maxHeight: "96vh",
              borderRadius: 12,
              background: "#222",
              boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
            }}
          />
        </div>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96 z-50">
            <h2 className="text-lg font-bold mb-4">Add Image Feedback</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Comment:</label>
              <textarea
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter your feedback..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Criterion:</label>
              <select
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
              >
                <option value="">Select criterion</option>
                {rubricCriteria.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Tag:</label>
              <select
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                value={newFeedbackTag}
                onChange={(e) => setNewFeedbackTag(e.target.value as any)}
              >
                <option value="info">Info</option>
                <option value="notice">Notice</option>
                <option value="tip">Tip</option>
                <option value="caution">Caution</option>
              </select>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" className="mr-2" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                onClick={addFeedback}
                disabled={!newComment.trim() || !newCriterion}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageViewer;
