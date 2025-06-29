import { Worker } from "@react-pdf-viewer/core";
import { Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedbackItem } from "@/types/assessment";
import { FileItem } from "@/types/file";

interface PDFViewerProps {
  fileUrl: string;
  file: FileItem;
  feedbacks: FeedbackItem[];
  feedbacksAll: FeedbackItem[];
  addFeedback: (feedback: FeedbackItem) => void;
  updateFeedback: (index: number, adjustedFeedback: FeedbackItem) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  rubricCriteria?: string[];
  gradingId: string;
  submissionReference: string;
  onTotalPagesChange?: (totalPages: number) => void;
  activeFeedbackId?: string | null;
}

export interface PDFViewerHandle {
  jumpToPage: (page: number) => void;
}

const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>(
  (
    {
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
    }: PDFViewerProps,
    ref,
  ) => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    const pageNavigationPluginInstanceRef = useRef<any>(pageNavigationPlugin());
    const pageNavigationPluginInstance = pageNavigationPluginInstanceRef.current;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [newFeedbackTag, setNewFeedbackTag] = useState<string>("info");
    const [newCriterion, setNewCriterion] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);

    // Expose jumpToPage to parent via ref (optional, not used here)
    useImperativeHandle(
      ref,
      () => ({
        jumpToPage: (page: number) => {
          if (
            typeof page === "number" &&
            page >= 1 &&
            page <= totalPages &&
            pageNavigationPluginInstance.jumpToPage
          ) {
            pageNavigationPluginInstance.jumpToPage(page - 1);
          }
        },
      }),
      [totalPages, pageNavigationPluginInstance],
    );

    // Function to handle document load and get total pages
    const handleDocumentLoad = (e: any) => {
      const numPages = e.doc.numPages;
      setTotalPages(numPages);
      if (onTotalPagesChange) {
        onTotalPagesChange(numPages);
      }
    };

    // Auto jump to page of active feedback
    useEffect(() => {
      if (activeFeedbackId != null && feedbacksAll && Array.isArray(feedbacksAll)) {
        const idx = Number(activeFeedbackId);
        const fb = feedbacksAll[idx];
        if (
          fb &&
          fb.locationData?.type === "pdf" &&
          typeof fb.locationData.page === "number" &&
          pageNavigationPluginInstance.jumpToPage &&
          totalPages > 0
        ) {
          pageNavigationPluginInstance.jumpToPage(fb.locationData.page - 1);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFeedbackId, feedbacks, totalPages]);

    // Function to add feedback for PDF
    const handleAddFeedback = () => {
      if (
        !newComment.trim() ||
        !newCriterion ||
        !currentPage ||
        currentPage < 1 ||
        currentPage > totalPages
      )
        return;

      // Format fileRef with gradingId and file.relativePath (always include gradingId)
      let fileRef = `${gradingId}/${submissionReference}/${file.relativePath || ""}`;
      console.log(
        "Adding feedback for fileRef:",
        fileRef,
        "gradingID",
        gradingId,
        "path",
        file.relativePath,
      );

      const newFeedback: FeedbackItem = {
        criterion: newCriterion,
        fileRef,
        comment: newComment.trim(),
        tag: newFeedbackTag,
        locationData: {
          type: "pdf",
          page: currentPage,
        },
      };
      console.log("New feedback item:", newFeedback);

      // Use addFeedback passed from parent instead
      addFeedback(newFeedback);

      setNewComment("");
      setNewFeedbackTag("info");
      setNewCriterion("");
      setIsDialogOpen(false);
      onHighlightComplete();
    };
    function validatePdfFeedbacks(
      feedbacks: FeedbackItem[],
      totalPages: number,
    ): FeedbackItem[] {
      return feedbacks.map((fb) => {
        // Only process PDF type feedbacks
        if (fb.locationData?.type !== "pdf") return fb;

        let page = fb.locationData.page;

        // Validate page number is within bounds
        if (typeof page === "number") {
          // Ensure page is between 1 and totalPages
          const validPage = Math.max(1, Math.min(page, totalPages || 1));

          // If page needed adjustment
          if (validPage !== page) {
            return {
              ...fb,
              locationData: {
                ...fb.locationData,
                page: validPage,
              },
            };
          }
        }

        return fb;
      });
    }

    // Add effect to validate PDF feedbacks when totalPages changes
    useEffect(() => {
      if (totalPages > 0 && feedbacks.length > 0) {
        const adjustedFeedbacks = validatePdfFeedbacks(feedbacks, totalPages);

        // Check for changes and update
        for (let i = 0; i < adjustedFeedbacks.length; i++) {
          if (JSON.stringify(adjustedFeedbacks[i]) !== JSON.stringify(feedbacks[i])) {
            // Find the global index
            const globalIdx = feedbacksAll.findIndex(
              (f) =>
                f.fileRef === feedbacks[i].fileRef &&
                f.criterion === feedbacks[i].criterion &&
                f.comment === feedbacks[i].comment &&
                JSON.stringify(f.locationData) ===
                  JSON.stringify(feedbacks[i].locationData),
            );

            if (globalIdx !== -1) {
              updateFeedback(globalIdx, adjustedFeedbacks[i]);
            }
          }
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPages, feedbacks]);
    // Show dialog automatically when isHighlightMode is true
    useEffect(() => {
      if (isHighlightMode) setIsDialogOpen(true);
      else setIsDialogOpen(false);
    }, [isHighlightMode]);

    // Nếu không có fileUrl thì không render Viewer
    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          No PDF file selected.
        </div>
      );
    }

    return (
      <div style={{ display: "flex", height: "100%", position: "relative" }}>
        <div
          style={{
            flex: 1,
            border: "1px solid rgba(0, 0, 0, 0.3)",
            padding: "10px",
            overflow: "hidden",
          }}
        >
          <Worker
            workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}
          >
            <Viewer
              fileUrl={fileUrl}
              plugins={[defaultLayoutPluginInstance, pageNavigationPluginInstance]}
              onDocumentLoad={handleDocumentLoad}
            />
          </Worker>
        </div>

        {isDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96 z-50">
              <h2 className="text-lg font-bold mb-4">Add PDF Feedback</h2>
              {/* Select page dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Page:</label>
                <select
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                >
                  {Array.from({ length: totalPages }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Page {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select Criterion:
                </label>
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
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  className="mr-2"
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
                  onClick={handleAddFeedback}
                  disabled={
                    !newComment.trim() ||
                    !newCriterion ||
                    !currentPage ||
                    currentPage < 1 ||
                    currentPage > totalPages
                  }
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default PDFViewer;
