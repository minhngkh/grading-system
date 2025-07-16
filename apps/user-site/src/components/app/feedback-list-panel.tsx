import React, { useState, useRef, useCallback, useMemo } from "react";
import { Assessment, FeedbackItem, LocationData } from "@/types/assessment";
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
import { UseFormReturn } from "react-hook-form";

interface FeedbackListPanelProps {
  feedbacks: FeedbackItem[];
  selectedFeedbackId: string | null;
  onSelect: (feedback: FeedbackItem) => void;
  assessment: Assessment;
  isAddingFeedback?: boolean;
  onAddFeedback?: (feedback: Partial<FeedbackItem>) => void;
  onCancelAdd?: () => void;
  rubricCriteria?: string[];
  currentFile?: any;
  locationData?: LocationData;
  form: UseFormReturn<Assessment>;
}

export const FeedbackListPanel: React.FC<FeedbackListPanelProps> = ({
  feedbacks,
  selectedFeedbackId,
  onSelect,
  assessment,
  isAddingFeedback = false,
  onAddFeedback,
  onCancelAdd,
  rubricCriteria = [],
  currentFile,
  locationData,
  form,
}) => {
  // Helper functions for feedback operations (no toast - direct form updates)
  const updateFeedback = useCallback(
    (feedbackId: string, feedback: FeedbackItem) => {
      try {
        const currentFeedbacks = form.getValues("feedbacks") || [];
        const index = currentFeedbacks.findIndex((f) => f.id === feedbackId);

        if (index !== -1) {
          const updated = [...currentFeedbacks];
          updated[index] = { ...updated[index], ...feedback };
          form.setValue("feedbacks", updated, { shouldValidate: false });
        }
      } catch (error) {
        console.error("Error updating feedback:", error);
      }
    },
    [form],
  );

  const deleteFeedback = useCallback(
    (feedbackId: string) => {
      try {
        const currentFeedbacks = form.getValues("feedbacks") || [];
        const filtered = currentFeedbacks.filter((f) => f.id !== feedbackId);
        form.setValue("feedbacks", filtered, { shouldValidate: false });
      } catch (error) {
        console.error("Error deleting feedback:", error);
      }
    },
    [form],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editTag, setEditTag] = useState("info");
  const [editCriterion, setEditCriterion] = useState("");

  // Add feedback form states
  const [addComment, setAddComment] = useState("");
  const [addTag, setAddTag] = useState("info");
  const [addCriterion, setAddCriterion] = useState("");

  // Memoize available criteria for performance
  const allCriteria = useMemo(() => {
    const availableCriteria = Array.from(
      new Set(
        (assessment?.feedbacks || [])
          .map((fb) => fb?.criterion)
          .filter((criterion): criterion is string => Boolean(criterion)),
      ),
    );
    return Array.from(new Set([...availableCriteria, ...rubricCriteria]));
  }, [assessment?.feedbacks, rubricCriteria]);

  // Memoize safe feedbacks
  const safeFeedbacks = useMemo(() => {
    return Array.isArray(feedbacks) ? feedbacks : [];
  }, [feedbacks]);

  const handleAddFeedbackSubmit = useCallback(() => {
    if (!addComment.trim() || !addCriterion || !onAddFeedback) return;

    // Use provided locationData or create default
    const feedbackLocationData = locationData || {
      type: "text" as const,
      fromLine: 1,
      toLine: 1,
      fromCol: 0,
      toCol: 0,
    };

    const newFeedback: Partial<FeedbackItem> = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      criterion: addCriterion,
      comment: addComment.trim(),
      tag: addTag,
      locationData: feedbackLocationData,
    };

    onAddFeedback(newFeedback);

    // Reset form
    setAddComment("");
    setAddTag("info");
    setAddCriterion("");
  }, [addComment, addCriterion, addTag, onAddFeedback, locationData]);

  const handleCancelAdd = useCallback(() => {
    setAddComment("");
    setAddTag("info");
    setAddCriterion("");
    onCancelAdd?.();
  }, [onCancelAdd]);

  const handleEditClick = useCallback((feedback: FeedbackItem) => {
    setEditingFeedbackId(feedback.id ?? null);
    setEditComment(feedback.comment);
    setEditTag(feedback.tag);
    setEditCriterion(feedback.criterion || "");
  }, []);

  const handleEditSave = useCallback(
    (feedbackId: string) => {
      if (!editComment.trim()) return;

      try {
        const updatedFeedback: Partial<FeedbackItem> = {
          comment: editComment.trim(),
          tag: editTag,
          criterion: editCriterion,
        };

        // Update feedback directly without toast
        updateFeedback(feedbackId, updatedFeedback as FeedbackItem);
        setEditingFeedbackId(null);
      } catch (error) {
        console.error("Error saving feedback:", error);
      }
    },
    [editComment, editTag, editCriterion, updateFeedback],
  );

  const handleDelete = useCallback(
    (feedbackId: string) => {
      try {
        // Delete feedback directly without toast
        deleteFeedback(feedbackId);
      } catch (error) {
        console.error("Error deleting feedback:", error);
      }
    },
    [deleteFeedback],
  );

  const handleEditCancel = useCallback(() => {
    setEditingFeedbackId(null);
    setEditComment("");
    setEditTag("info");
    setEditCriterion("");
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto space-y-2 w-full"
      style={{ contain: "layout" }}
    >
      {/* Add Feedback Form */}
      {isAddingFeedback && (
        <div
          className="border rounded-lg p-2 border-primary w-full"
          style={{ contain: "layout" }}
        >
          <div className="space-y-3 w-full">
            <div className="space-y-1">
              <label className="text-xs font-medium">Criterion:</label>
              <Select value={addCriterion} onValueChange={setAddCriterion}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select criterion" />
                </SelectTrigger>
                <SelectContent>
                  {allCriteria.map((criterion) => (
                    <SelectItem key={criterion} value={criterion} className="text-xs">
                      {criterion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Tag:</label>
              <Select value={addTag} onValueChange={setAddTag}>
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

            <div className="space-y-1">
              <label className="text-xs font-medium">Comment:</label>
              <Textarea
                value={addComment}
                onChange={(e) => setAddComment(e.target.value)}
                placeholder="Enter your feedback..."
                className="min-h-[60px] !text-xs resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelAdd}
                className="h-7 px-3"
              >
                <X className="h-3 w-3 mr-1" />
                <span className="text-xs">Cancel</span>
              </Button>
              <Button
                size="sm"
                onClick={handleAddFeedbackSubmit}
                disabled={!addComment.trim() || !addCriterion}
                className="h-7 px-3"
              >
                <Check className="h-3 w-3 mr-1" />
                <span className="text-xs">Add Feedback</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Feedbacks */}
      {safeFeedbacks.filter((feedback) => feedback?.tag !== "summary").length > 0 ?
        safeFeedbacks
          .filter((feedback) => feedback?.tag !== "summary")
          .map((feedback) => {
            if (!feedback?.id) return null;

            const isActive = selectedFeedbackId === feedback.id;
            const isEditing = editingFeedbackId === feedback.id;

            return (
              <div
                key={feedback.id}
                className={`border rounded-lg p-2 transition-all duration-200 ${
                  isEditing ? "" : (
                    "hover:bg-primary-foreground cursor-pointer hover:shadow-sm"
                  )
                } ${isActive && !isEditing ? "bg-primary-foreground " : ""}`}
                onClick={
                  isEditing ? undefined : (
                    () => {
                      // If already active, deactivate it; otherwise, activate it
                      if (isActive) {
                        onSelect({ ...feedback, id: "" }); // Pass empty id to deactivate
                      } else {
                        onSelect(feedback);
                      }
                    }
                  )
                }
              >
                {isEditing ?
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Criterion:
                      </label>
                      <Select value={editCriterion} onValueChange={setEditCriterion}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select criterion" />
                        </SelectTrigger>
                        <SelectContent>
                          {allCriteria.map((criterion) => (
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
                            handleDelete(feedback.id ?? "");
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
          .filter(Boolean)
      : <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">There is no feedback</p>
        </div>
      }
    </div>
  );
};
