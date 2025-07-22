import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Assessment } from "@/types/assessment";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { FileItem } from "@/types/file";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: FileItem;
  activeFeedbackId?: number | null;
  onPageSelect?: (page: number | null) => void;
  assessment: Assessment;
  onUpdate: (updatedAssessment: Partial<Assessment>) => void;
  onUpdateLastSave: (updatedLastSaved: Partial<Assessment>) => void;
}

const PDFViewer = ({
  file,
  activeFeedbackId,
  onPageSelect,
  assessment,
  onUpdate,
  onUpdateLastSave,
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

  useEffect(() => {
    setNumPages(0);
    setTotalPages(0);
  }, [file.content]);

  const handleLoadSuccess = ({ numPages }: any) => {
    setNumPages(numPages);
    setTotalPages(numPages);
  };

  const validFeedbacks = assessment.feedbacks
    .map((fb, idx) => ({ fb, idx }))
    .filter(
      ({ fb }) =>
        fb.fileRef &&
        (fb.fileRef.endsWith(file.name) ||
          fb.fileRef.includes(`/${file.name}`) ||
          fb.fileRef.split("/").pop() === file.name),
    );

  useEffect(() => {
    if (
      typeof activeFeedbackId === "number" &&
      activeFeedbackId >= 0 &&
      assessment.feedbacks[activeFeedbackId]
    ) {
      const fb = assessment.feedbacks[activeFeedbackId];
      if (fb.locationData?.type === "pdf") {
        const pageNum = fb.locationData.page;
        const selector = `[data-page-number="${pageNum}"]`;
        const el = document.querySelector<HTMLDivElement>(selector);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setCurrentPage(pageNum);
        }
      }
    }
  }, [activeFeedbackId]);

  useEffect(() => {
    if (totalPages > 0 && validFeedbacks.length) {
      const adjusted = validFeedbacks.map(({ fb }) => {
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

      let hasChanges = false;
      for (let i = 0; i < adjusted.length; i++) {
        if (JSON.stringify(adjusted[i]) !== JSON.stringify(validFeedbacks[i].fb)) {
          hasChanges = true;
        }
      }

      if (hasChanges) {
        const updatedFeedbacks = assessment.feedbacks.map((fb, idx) => {
          const match = validFeedbacks.find(({ idx: i }) => i === idx);
          if (match) {
            const adj = adjusted[validFeedbacks.findIndex(({ idx: i }) => i === idx)];
            return adj || fb;
          }
          return fb;
        });
        onUpdate({ feedbacks: updatedFeedbacks });
        onUpdateLastSave({ feedbacks: updatedFeedbacks });
      }
    }
  }, [totalPages, validFeedbacks, onUpdate, assessment.feedbacks]);

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    onPageSelect?.(pageNumber);
  };

  if (!file.content) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No PDF file selected.
      </div>
    );
  }

  return (
    <div className="flex-col h-full overflow-auto relative">
      <div ref={containerRef} className="flex-1 flex justify-center bg-white py-4">
        <Document
          key={file.content}
          file={file.content}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={console.error}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              scale={scale}
              onRenderError={console.error}
              className={`mb-4 cursor-pointer${typeof activeFeedbackId === "number" && validFeedbacks[activeFeedbackId]?.fb.locationData?.type === "pdf" && validFeedbacks[activeFeedbackId]?.fb.locationData.page === i + 1 ? " ring-2 ring-primary" : ""}`}
              onClick={() => handlePageClick(i + 1)}
            />
          ))}
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
