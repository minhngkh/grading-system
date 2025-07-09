import { useState, useEffect, useRef } from "react";
import { FeedbackItem } from "@/types/assessment";
import { FileItem } from "@/types/file";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImageViewerProps {
  src: string;
  file: FileItem;
  addFeedback: (newFeedback: FeedbackItem) => void;
  // updateFeedback: (newFeedbacks: FeedbackItem[]) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  rubricCriteria?: string[];
  gradingId: string;
  submissionReference: string;
}

export const ImageViewer = ({
  src,
  file,
  addFeedback,
  // updateFeedback,
  isHighlightMode,
  onHighlightComplete,
  rubricCriteria = [],
  gradingId,
  submissionReference,
}: ImageViewerProps) => {
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newFeedbackTag, setNewFeedbackTag] = useState<string>("info");
  const [newCriterion, setNewCriterion] = useState<string>("");
  const imageModalRef = useRef<HTMLImageElement>(null);
  // Function to handle adding feedback for image
  const handleAddFeedback = () => {
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

    addFeedback(newFeedback);
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
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // If modal is open and click is outside the image
      if (
        open &&
        imageModalRef.current &&
        !imageModalRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    // Add event listener when modal is open
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewComment("");
    setNewFeedbackTag("info");
    setNewCriterion("");
    if (onHighlightComplete) onHighlightComplete();
  };

  return (
    <>
      <div className={`flex justify-center items-center w-full`}>
        <img className="hover:cursor-zoom-in" src={src} onClick={() => setOpen(true)} />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <img
            ref={imageModalRef}
            src={src}
            style={{
              maxWidth: "96vw",
              maxHeight: "96vh",
              objectFit: "contain",
              borderRadius: 12,
              background: "#222",
              boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
            }}
          />
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Image Feedback</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tag" className="text-sm font-medium">
                Select Tag
              </Label>
              <Select value={newFeedbackTag} onValueChange={setNewFeedbackTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="notice">Notice</SelectItem>
                  <SelectItem value="tip">Tip</SelectItem>
                  <SelectItem value="caution">Caution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="criterion" className="text-sm font-medium">
                Select Criterion
              </Label>
              <Select value={newCriterion} onValueChange={setNewCriterion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select criterion" />
                </SelectTrigger>
                <SelectContent>
                  {rubricCriteria.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comment" className="text-sm font-medium">
                Comment
              </Label>
              <Textarea
                id="comment"
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter your feedback..."
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAddFeedback}
              disabled={!newComment.trim() || !newCriterion}
            >
              Add Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageViewer;
