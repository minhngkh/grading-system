// PDFViewer.tsx
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
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
import { FeedbackItem } from "@/types/assessment";
import { FileItem } from "@/types/file";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  file: FileItem;
  feedbacks: FeedbackItem[];
  feedbacksAll: FeedbackItem[];
  addFeedback: (fb: FeedbackItem) => void;
  updateFeedback: (index: number, fb: FeedbackItem) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  rubricCriteria?: string[];
  gradingId: string;
  submissionReference: string;
  onTotalPagesChange?: (n: number) => void;
  activeFeedbackId?: string | null;
  onFeedbackValidated?: (adjusted: FeedbackItem[]) => void;
}

const PDFViewer = ({
  fileUrl,
  file,
  feedbacks,
  feedbacksAll,
  addFeedback,
  updateFeedback,
  isHighlightMode,
  onHighlightComplete,
  rubricCriteria = [],
  gradingId,
  submissionReference,
  onTotalPagesChange,
  activeFeedbackId,
  onFeedbackValidated,
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [newComment, setNewComment] = useState("");
  const [newFeedbackTag, setNewFeedbackTag] = useState("info");
  const [newCriterion, setNewCriterion] = useState("");
  const [scale, setScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        setScale((s) => {
          const newScale = Math.min(5, Math.max(0.25, s + delta));
          return newScale;
        });
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Reset khi đổi file
  useEffect(() => {
    setNumPages(0);
    setTotalPages(0);
  }, [fileUrl]);

  // Khi document load
  const handleLoadSuccess = ({ numPages }: any) => {
    setNumPages(numPages);
    setTotalPages(numPages);
    onTotalPagesChange?.(numPages);
  };

  // Sửa feedbacks vượt giới hạn trang
  useEffect(() => {
    if (totalPages > 0 && feedbacks.length) {
      const adjusted = feedbacks.map((fb) => {
        if (fb.locationData?.type === "pdf" && typeof fb.locationData.page === "number") {
          const valid = Math.max(1, Math.min(fb.locationData.page, totalPages));
          if (valid !== fb.locationData.page) {
            return { ...fb, locationData: { ...fb.locationData, page: valid } };
          }
        }
        return fb;
      });

      const changed = adjusted.some(
        (fb, i) => JSON.stringify(fb) !== JSON.stringify(feedbacks[i]),
      );
      if (changed) {
        adjusted.forEach((fb) => {
          const idx = feedbacksAll.findIndex((f) => f.id === fb.id);
          if (idx !== -1) updateFeedback(idx, fb);
        });
        onFeedbackValidated?.(adjusted);
      }
    }
  }, [totalPages, feedbacks, feedbacksAll, updateFeedback, onFeedbackValidated]);

  // Mở dialog khi bật highlight mode
  useEffect(() => setIsDialogOpen(isHighlightMode), [isHighlightMode]);

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No PDF file selected.
      </div>
    );
  }

  const handleAddFeedback = () => {
    if (!newComment.trim() || !newCriterion) return;

    const fb: FeedbackItem = {
      criterion: newCriterion,
      fileRef: `${gradingId}/${submissionReference}/${file.relativePath || ""}`,
      comment: newComment.trim(),
      tag: newFeedbackTag,
      locationData: { type: "pdf", page: currentPage },
    };
    addFeedback(fb);
    setNewComment("");
    setNewCriterion("");
    setNewFeedbackTag("info");
    setIsDialogOpen(false);
    onHighlightComplete();
  };

  useEffect(() => {
    if (!activeFeedbackId) return;

    const fb = feedbacksAll.find((f) => f.id === activeFeedbackId);
    if (fb?.locationData?.type === "pdf") {
      const pageNum = fb.locationData.page;
      const selector = `[data-page-number="${pageNum + 1}"]`;
      const el = document.querySelector<HTMLDivElement>(selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setCurrentPage(pageNum);
      }
    }
  }, [activeFeedbackId, feedbacksAll]);

  return (
    <div className="flex-col h-full relative">
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center bg-white py-4"
      >
        <Document
          key={fileUrl}
          file={fileUrl}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={console.error}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              scale={scale}
              onRenderError={console.error}
              className="mb-4"
            />
          ))}
        </Document>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add PDF Feedback</DialogTitle>
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
              <Label htmlFor="page" className="text-sm font-medium">
                Select Page
              </Label>
              <Select
                value={currentPage.toString()}
                onValueChange={(value) => setCurrentPage(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Page {i + 1}
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
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setNewComment("");
                setNewFeedbackTag("info");
                setNewCriterion("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !newComment.trim() ||
                !newCriterion ||
                !currentPage ||
                currentPage < 1 ||
                currentPage > totalPages
              }
              onClick={handleAddFeedback}
            >
              Add Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDFViewer;
