import React, { useState } from "react";
import { FeedbackItem } from "@/types/assessment";
import { Badge } from "@/components/ui/badge";
import { Trash, MessageSquare, Pen, Check, X } from "lucide-react";
import { getTagColor } from "@/pages/assessment/edit-assessment/icon-utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedbackListPanelProps {
  feedbacks: FeedbackItem[];
  selectedFeedbackId: string | null;
  onSelect: (feedback: FeedbackItem) => void;
  onDelete: (feedbackId: string) => void;
  allFeedbacks: FeedbackItem[];
  activeCriterion?: string; // optional, for criterion tab
  addFeedback?: (feedback: FeedbackItem) => void; // callback for adding feedback
  updateFeedback?: (index: number, updatedFeedback: Partial<FeedbackItem>) => void;
}

export const FeedbackListPanel: React.FC<FeedbackListPanelProps> = ({
  feedbacks,
  selectedFeedbackId,
  onSelect,
  onDelete,
  allFeedbacks,
  updateFeedback,
}) => {
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editTag, setEditTag] = useState("info");
  const [editCriterion, setEditCriterion] = useState("");

  // Get unique criteria from all feedbacks
  const availableCriteria = Array.from(
    new Set(allFeedbacks.map((fb) => fb.criterion).filter(Boolean)),
  );

  const handleEditClick = (feedback: FeedbackItem) => {
    setEditingFeedbackId(feedback.id ?? null);
    setEditComment(feedback.comment);
    setEditTag(feedback.tag);
    setEditCriterion(feedback.criterion || "");
  };

  const handleEditSave = (feedbackId: string) => {
    if (!updateFeedback || !editComment.trim()) return;

    const index = allFeedbacks.findIndex((fb) => fb.id === feedbackId);
    if (index >= 0) {
      updateFeedback(index, {
        comment: editComment.trim(),
        tag: editTag,
        criterion: editCriterion,
      });
    }

    setEditingFeedbackId(null);
  };

  const handleEditCancel = () => {
    setEditingFeedbackId(null);
    setEditComment("");
    setEditTag("info");
    setEditCriterion("");
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      {
        // Lọc bỏ summary feedback
        feedbacks.filter((feedback) => feedback.tag !== "summary").length > 0 ?
          feedbacks
            .filter((feedback) => feedback.tag !== "summary")
            .map((feedback) => {
              const isActive = selectedFeedbackId === feedback.id;
              const isEditing = editingFeedbackId === feedback.id;

              return (
                <div
                  key={feedback.id}
                  className={`border rounded-lg p-2 transition-all duration-200 ${
                    isEditing ? "" : (
                      "hover:bg-primary-foreground cursor-pointer hover:shadow-sm"
                    )
                  } ${isActive && !isEditing ? "bg-primary-foreground" : ""}`}
                  onClick={isEditing ? undefined : () => onSelect(feedback)}
                >
                  {
                    isEditing ?
                      // Edit mode
                      <div className="space-y-3">
                        {/* Criterion selection */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Criterion:
                          </label>
                          <Select value={editCriterion} onValueChange={setEditCriterion}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select criterion" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCriteria.map((criterion) => (
                                <SelectItem
                                  key={criterion}
                                  value={criterion}
                                  className="text-xs"
                                >
                                  {criterion}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tag selection */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Tag:
                          </label>
                          <Select value={editTag} onValueChange={setEditTag}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info" className="text-xs">
                                Info
                              </SelectItem>
                              <SelectItem value="notice" className="text-xs">
                                Notice
                              </SelectItem>
                              <SelectItem value="tip" className="text-xs">
                                Tip
                              </SelectItem>
                              <SelectItem value="caution" className="text-xs">
                                Caution
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Comment editing */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Comment:
                          </label>
                          <Textarea
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            placeholder="Edit feedback comment..."
                            className="min-h-[60px] !text-xs resize-none"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditCancel}
                            className="h-7 px-3"
                          >
                            <X className="h-3 w-3 mr-1" />
                            <span className="text-xs">Cancel</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditSave(feedback.id ?? "")}
                            disabled={!editComment.trim()}
                            className="h-7 px-3"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            <span className="text-xs">Save</span>
                          </Button>
                        </div>
                      </div>
                      // View mode - exactly like original
                    : <div className="flex items-start gap-2">
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
                                onDelete(feedback.id ?? "");
                              }}
                            />
                            <Pen
                              className="h-4 w-4 text-gray-500 cursor-pointer hover:text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(feedback);
                              }}
                            />
                          </div>
                          <Badge
                            className={`${getTagColor(feedback.tag)} text-gray-800 text-xs`}
                          >
                            {feedback.tag}
                          </Badge>

                          <p className="text-xs text-muted-foreground break-words whitespace-pre-wrap">
                            {feedback.comment}
                          </p>
                        </div>
                      </div>

                  }
                </div>
              );
            })
        : <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">There is no feedback</p>
          </div>

      }
    </div>
  );
};
