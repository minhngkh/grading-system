import React, { useState } from "react";
import { FeedbackItem } from "@/types/assessment";
import { Badge } from "@/components/ui/badge";
import { Trash, MessageSquare, Pen } from "lucide-react";
import { getTagColor } from "./icon-utils";
import { Button } from "@/components/ui/button";

interface FeedbackListPanelProps {
  feedbacks: FeedbackItem[];
  selectedFeedbackIndex: number | null;
  onSelect: (feedback: FeedbackItem, index: number) => void;
  onDelete: (index: number) => void;
  allFeedbacks: FeedbackItem[];
  activeCriterion?: string; // optional, for criterion tab
  addFeedback?: (feedback: FeedbackItem) => void; // callback for adding feedback
  updateFeedback?: (index: number, updatedFeedback: Partial<FeedbackItem>) => void; // thêm prop này
}

export const FeedbackListPanel: React.FC<FeedbackListPanelProps> = ({
  feedbacks,
  selectedFeedbackIndex,
  onSelect,
  onDelete,
  allFeedbacks,
  updateFeedback,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editComment, setEditComment] = useState("");
  const [editTag, setEditTag] = useState("info");
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleEditClick = (feedback: FeedbackItem, index: number) => {
    setEditComment(feedback.comment);
    setEditTag(feedback.tag);
    setEditIndex(index);
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (editIndex === null || !updateFeedback) return;
    updateFeedback(editIndex, { comment: editComment, tag: editTag });
    setEditDialogOpen(false);
    setEditIndex(null);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-2">
        {
          // Lọc bỏ summary feedback
          feedbacks.filter((feedback) => feedback.tag !== "summary").length > 0 ?
            feedbacks
              .filter((feedback) => feedback.tag !== "summary")
              .map((feedback) => {
                const globalIndex = allFeedbacks.findIndex((fb) => fb === feedback);
                const isActive = selectedFeedbackIndex === globalIndex;
                return (
                  <div
                    key={globalIndex}
                    className={
                      `border rounded-lg p-2 hover:bg-primary-foreground cursor-pointer transition-all duration-200 hover:shadow-sm flex items-start gap-2 ` +
                      (isActive ? `bg-primary-foreground` : "")
                    }
                    onClick={() => {
                      onSelect(feedback, globalIndex);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {feedback.criterion}
                        </span>
                        <span className="text-xs text-gray-500">
                          {feedback.locationData?.type === "text" &&
                            `L${feedback.locationData.fromLine}-${feedback.locationData.toLine}`}
                          {feedback.locationData?.type === "pdf" &&
                            `Page ${feedback.locationData.page}`}
                          {feedback.locationData?.type === "image" && `Image`}
                        </span>
                        <Trash
                          className="h-4 w-4 text-gray-500 cursor-pointer hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(globalIndex);
                          }}
                        />
                        <Pen
                          className="h-4 w-4 text-gray-500 cursor-pointer hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(feedback, globalIndex);
                          }}
                        />
                      </div>
                      <Badge className={`${getTagColor(feedback.tag)} text-gray-800`}>
                        {feedback.tag}
                      </Badge>

                      <p className="text-xs text-muted-foreground break-words whitespace-pre-wrap">
                        {feedback.comment}
                      </p>
                    </div>
                  </div>
                );
              })
          : <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">There is no feedback</p>
            </div>

        }
      </div>
      {editDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96 z-50">
            <h2 className="text-lg font-bold mb-4">Edit Feedback</h2>
            <textarea
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              rows={4}
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              placeholder="Edit feedback..."
            />
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Select Tag:</label>
              <select
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
              >
                <option value="info">Info</option>
                <option value="notice">Notice</option>
                <option value="tip">Tip</option>
                <option value="caution">Caution</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                className="mr-2"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSave} disabled={!editComment.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
