import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
import useAssessmentForm from "@/hooks/use-assessment-form";
import { FileItem } from "@/types/file";

interface FeedbackListPanelProps {
  selectedFeedbackIndex: number | null;
  onSelect: (feedback: FeedbackItem, index: number) => void;
  assessment: Assessment;
  isAddingFeedback?: boolean;
  onCancelAdd?: () => void;
  rubricCriteria?: string[];
  locationData?: LocationData;
  onUpdate: (updatedAssessment: Partial<Assessment>) => void;
  byFile: boolean;
  currentFile: FileItem | null;
  currentCriterion: string;
}

function getFeedbackTagName(tag: string): string {
  switch (tag) {
    case "info":
      return "Info";
    case "notice":
      return "Notice";
    case "tip":
      return "Tip";
    case "caution":
      return "Caution";
    default:
      return tag;
  }
}

export const FeedbackListPanel: React.FC<FeedbackListPanelProps> = ({
  selectedFeedbackIndex,
  onSelect,
  assessment,
  isAddingFeedback = false,
  onCancelAdd,
  rubricCriteria = [],
  locationData,
  onUpdate,
  byFile,
  currentFile,
  currentCriterion,
}) => {
  const { form, formData } = useAssessmentForm(assessment);
  const [editingFeedbackIndex, setEditingFeedbackIndex] = useState<number | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editTag, setEditTag] = useState("info");
  const [editCriterion, setEditCriterion] = useState("");
  const [addComment, setAddComment] = useState("");
  const [addTag, setAddTag] = useState("info");
  const [addCriterion, setAddCriterion] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAddingFeedback && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isAddingFeedback]);

  const handleAddFeedbackSubmit = useCallback(() => {
    if (!addComment.trim() || !addCriterion) return;
    const feedbackLocationData = locationData || {
      type: "text",
      fromLine: 1,
      toLine: 1,
      fromCol: 0,
      toCol: 0,
    };
    const newFeedback: FeedbackItem = {
      criterion: addCriterion,
      comment: addComment.trim(),
      tag: addTag,
      locationData: feedbackLocationData,
      fileRef:
        byFile && currentFile ?
          `${assessment?.submissionReference || ""}/${currentFile.relativePath || currentFile.name || ""}`
        : "",
    };
    const updatedFeedbacks = [...formData.feedbacks, newFeedback];
    form.setValue("feedbacks", updatedFeedbacks, { shouldValidate: true });
    onUpdate({ feedbacks: updatedFeedbacks });
    setAddComment("");
    setAddTag("info");
    setAddCriterion("");
    onCancelAdd?.();
  }, [
    addComment,
    addCriterion,
    addTag,
    locationData,
    byFile,
    currentFile,
    assessment?.submissionReference,
    formData.feedbacks,
    form,
    onUpdate,
    onCancelAdd,
  ]);

  const handleEditSave = useCallback(
    (index: number) => {
      if (!editComment.trim()) return;
      if (index < 0 || index >= formData.feedbacks.length) return;
      const updatedFeedbacks = [...formData.feedbacks];
      updatedFeedbacks[index] = {
        ...updatedFeedbacks[index],
        comment: editComment.trim(),
        tag: editTag,
        criterion: editCriterion,
        locationData: updatedFeedbacks[index].locationData,
        fileRef: updatedFeedbacks[index].fileRef,
      };
      form.setValue("feedbacks", updatedFeedbacks, { shouldValidate: true });
      onUpdate({ feedbacks: updatedFeedbacks });
      setEditingFeedbackIndex(null);
    },
    [editComment, editTag, editCriterion, formData.feedbacks, form, onUpdate],
  );

  const handleDelete = useCallback(
    (index: number) => {
      if (index < 0 || index >= formData.feedbacks.length) return;
      const updatedFeedbacks = [...formData.feedbacks];
      updatedFeedbacks[index] = {
        ...updatedFeedbacks[index],
        tag: "discard",
      };
      form.setValue("feedbacks", updatedFeedbacks, { shouldValidate: true });
      onUpdate({ feedbacks: updatedFeedbacks });
    },
    [formData.feedbacks, form, onUpdate],
  );

  const handleEditClick = useCallback((index: number, feedback: FeedbackItem) => {
    setEditingFeedbackIndex(index);
    setEditComment(feedback.comment);
    setEditTag(feedback.tag);
    setEditCriterion(feedback.criterion || "");
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingFeedbackIndex(null);
    setEditComment("");
    setEditTag("info");
    setEditCriterion("");
  }, []);

  const allCriteria = useMemo(() => {
    const availableCriteria = Array.from(
      new Set((assessment?.feedbacks || []).map((fb) => fb?.criterion).filter(Boolean)),
    );
    return Array.from(new Set([...availableCriteria, ...rubricCriteria]));
  }, [assessment?.feedbacks, rubricCriteria]);

  return (
    <div
      ref={containerRef}
      className="custom-scrollbar flex-1 overflow-y-auto space-y-2 w-full"
      style={{ contain: "layout", padding: "0.5rem" }}
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

            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={handleAddFeedbackSubmit}
                disabled={!addComment.trim() || !addCriterion}
                className="h-7 px-3 w-full"
              >
                <Check className="h-3 w-3 mr-1" />
                <span className="text-xs">Add Feedback</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelAdd}
                className="h-7 px-3 w-full"
              >
                <X className="h-3 w-3 mr-1" />
                <span className="text-xs">Cancel</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Feedbacks */}
      {(
        formData.feedbacks
          .filter((fb) => {
            if (byFile) {
              const fileRefRelativePath =
                fb.fileRef ? fb.fileRef.substring(fb.fileRef.indexOf("/") + 1) : "";
              const fileName = currentFile?.relativePath;
              return fileRefRelativePath === fileName;
            } else if (currentCriterion) {
              return fb.criterion === currentCriterion;
            }
            return true;
          })
          .filter((fb) => fb?.tag !== "summary" && fb?.tag !== "discard").length > 0
      ) ?
        formData.feedbacks
          .map((fb, idx) => ({ fb, idx }))
          .filter(({ fb }) => {
            if (byFile && currentFile) {
              const fileRefRelativePath =
                fb.fileRef ? fb.fileRef.substring(fb.fileRef.indexOf("/") + 1) : "";
              return fileRefRelativePath === currentFile.relativePath;
            } else if (currentCriterion) {
              return fb.criterion === currentCriterion;
            }
            return true;
          })
          .filter(({ fb }) => fb?.tag !== "summary" && fb?.tag !== "discard")
          .map(({ fb, idx }) => {
            const isActive = selectedFeedbackIndex === idx;
            const isEditing = editingFeedbackIndex === idx;
            return (
              <div
                key={idx}
                className={`border rounded-lg p-2 transition-all duration-200 ${
                  isEditing ? "" : (
                    "hover:bg-primary-foreground cursor-pointer hover:shadow-sm"
                  )
                } ${isActive && !isEditing ? "bg-primary-foreground " : ""}`}
                onClick={
                  isEditing ? undefined : (
                    () => {
                      onSelect(fb, idx);
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

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditSave(idx)}
                        disabled={!editComment.trim()}
                        className="h-7 px-3 w-full"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        <span className="text-xs">Save</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditCancel}
                        className="h-7 px-3 w-full"
                      >
                        <X className="h-3 w-3 mr-1" />
                        <span className="text-xs">Cancel</span>
                      </Button>
                    </div>
                  </div>
                : <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium">{fb.criterion}</span>
                          <div className="flex items-center gap-1">
                            <Trash
                              className="h-4 w-4 text-gray-500 cursor-pointer hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(idx);
                              }}
                            />
                            <Pen
                              className="h-4 w-4 text-gray-500 cursor-pointer hover:text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(idx, fb);
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Location:{" "}
                          {fb.locationData?.type === "text" &&
                            `L${fb.locationData.fromLine}-${fb.locationData.toLine}`}
                          {fb.locationData?.type === "pdf" &&
                            `Page ${fb.locationData.page}`}
                          {fb.locationData?.type === "image" && `Image`}
                        </div>
                      </div>
                      <Badge className={`${getTagColor(fb.tag)} text-gray-800 text-xs`}>
                        {getFeedbackTagName(fb.tag)}
                      </Badge>
                      <p className="text-xs break-words whitespace-pre-wrap">
                        {fb.comment}
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
