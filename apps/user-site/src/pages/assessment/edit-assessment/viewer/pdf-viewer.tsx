// PDFViewer.tsx
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FeedbackItem } from "@/types/assessment";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  feedbacks: FeedbackItem[];
  updateFeedback: (feedbackId: string, fb: FeedbackItem) => void;
  activeFeedbackId?: string | null;
  onPageSelect?: (page: number | null) => void;
  updateLastSavedData?: (updates: { feedbacks: FeedbackItem[] }) => void;
  formData?: { feedbacks: FeedbackItem[] };
}

const PDFViewer = ({
  fileUrl,
  feedbacks,
  updateFeedback,
  activeFeedbackId,
  onPageSelect,
  updateLastSavedData,
  formData,
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  void currentPage;
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
  };

  // Simplified feedback validation - use ID-based updates
  useEffect(() => {
    if (totalPages > 0 && feedbacks.length) {
      const adjusted = feedbacks.map((fb) => {
        if (fb.locationData?.type === "pdf" && typeof fb.locationData.page === "number") {
          const valid = Math.max(1, Math.min(fb.locationData.page, totalPages));
          if (valid !== fb.locationData.page) {
            return {
              ...fb,
              locationData: { ...fb.locationData, page: valid },
            };
          }
        }
        return fb;
      });

      // Use ID-based updates instead of global index lookups
      let hasChanges = false;
      for (let i = 0; i < adjusted.length; i++) {
        if (JSON.stringify(adjusted[i]) !== JSON.stringify(feedbacks[i])) {
          const originalFeedback = feedbacks[i];
          if (originalFeedback.id) {
            updateFeedback(originalFeedback.id, adjusted[i]);
            hasChanges = true;
          }
        }
      }

      // Update lastSavedData after normalization to prevent revert button from being enabled
      if (hasChanges && updateLastSavedData && formData) {
        // Use a longer timeout to ensure form state has been updated
        setTimeout(() => {
          // Create the updated feedbacks list with normalized data
          const updatedFeedbacks = formData.feedbacks.map((fb) => {
            const adjustedFb = adjusted.find((adj) => adj.id === fb.id);
            return adjustedFb || fb;
          });
          updateLastSavedData({ feedbacks: updatedFeedbacks });
        }, 150);
      }
    }
  }, [totalPages, feedbacks, updateFeedback, updateLastSavedData, formData]);

  // Internal page click handler
  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    onPageSelect?.(pageNumber);
  };

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No PDF file selected.
      </div>
    );
  }

  // Simplified scroll to active feedback
  useEffect(() => {
    if (!activeFeedbackId) return;

    const fb = feedbacks.find((f) => f.id === activeFeedbackId);
    if (fb?.locationData?.type === "pdf") {
      const pageNum = fb.locationData.page;
      const selector = `[data-page-number="${pageNum}"]`;
      const el = document.querySelector<HTMLDivElement>(selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setCurrentPage(pageNum);
      }
    }
  }, [activeFeedbackId, feedbacks]);

  return (
    <div className="flex-col h-full overflow-auto relative">
      <div ref={containerRef} className="flex-1 flex justify-center bg-white py-4">
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
              className="mb-4 cursor-pointer"
              onClick={() => handlePageClick(i + 1)}
            />
          ))}
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
