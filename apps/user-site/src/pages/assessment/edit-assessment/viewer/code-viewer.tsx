import { useState, useEffect } from "react";
import ShikiHighlighter from "react-shiki";
import { FeedbackItem } from "@/types/assessment";
import { useTheme } from "@/context/theme-provider";
import "./viewer.css";
import { FileItem } from "@/types/file";
import FeedbackTooltip from "@/pages/assessment/edit-assessment/viewer/feedback-tooltip";

interface HighlightableViewerProps {
  file: FileItem;
  feedbacks: FeedbackItem[];
  updateFeedback: (feedbackId: string, updatedFeedback: FeedbackItem) => void;
  activeFeedbackId?: string | null;
  onSelectionMade?: () => void;
  onSelectionChange?: (selection: any) => void;
  updateLastSavedData?: (updates: { feedbacks: FeedbackItem[] }) => void;
  formData?: { feedbacks: FeedbackItem[] };
}

const HighlightableViewer = ({
  file,
  feedbacks,
  updateFeedback,
  activeFeedbackId,
  onSelectionMade,
  onSelectionChange,
  updateLastSavedData,
  formData,
}: HighlightableViewerProps) => {
  const { theme } = useTheme();
  const [selectionRange, setSelectionRange] = useState<{
    from: { line: number; col: number };
    to: { line: number; col: number };
  } | null>(null);
  const [tooltipFb, setTooltipFb] = useState<FeedbackItem | null>(null);
  const [startLineElement, setStartLineElement] = useState<HTMLElement | null>(null);
  const [endLineElement, setEndLineElement] = useState<HTMLElement | null>(null);

  let language = "plaintext";
  if (file.relativePath) {
    language =
      {
        js: "javascript",
        jsx: "jsx",
        ts: "typescript",
        tsx: "tsx",
        json: "json",
        css: "css",
        scss: "scss",
        html: "html",
        c: "c",
        cpp: "cpp",
        java: "java",
        py: "python",
        go: "go",
        rs: "rust",
        php: "php",
        rb: "ruby",
        cs: "csharp",
        swift: "swift",
        kt: "kotlin",
        md: "markdown",
        txt: "plaintext",
        h: "c",
      }[file.extension] || "plaintext";
  }

  useEffect(() => {
    let isMouseDown = false,
      startPosition: { line: number; col: number } | null = null;

    const calculateColumn = (e: MouseEvent, lineEl: HTMLElement): number => {
      let range: Range | null = null;
      if ("caretRangeFromPoint" in document) {
        range = (document as any).caretRangeFromPoint(e.clientX, e.clientY);
      } else if ("caretPositionFromPoint" in document) {
        const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
        range = (document as Document).createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.setEnd(pos.offsetNode, pos.offset);
      }
      if (!range) return 0;

      if (!lineEl.contains(range.startContainer)) return 0;
      const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT, null);
      let charCount = 0,
        node = walker.nextNode() as Text | null;
      while (node) {
        if (node === range.startContainer) {
          charCount += range.startOffset;
          return charCount;
        }
        charCount += node.textContent?.length ?? 0;
        node = walker.nextNode() as Text | null;
      }
      return 0;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const lineEl = (e.target as HTMLElement).closest(
        file.type === "code" ? ".line" : "[data-line]",
      ) as HTMLElement;
      if (!lineEl) return;
      isMouseDown = true;
      const line =
        file.type === "code" ?
          parseInt(lineEl.dataset.line || "0", 10)
        : parseInt(lineEl.dataset.line || "0", 10) + 1;
      const col = calculateColumn(e, lineEl);
      startPosition = { line, col };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp, { once: true });
    };
    const onMouseMove = () => {
      // Track mouse movement for potential future use
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const lineEl = (e.target as HTMLElement).closest(
        file.type === "code" ? ".line" : "[data-line]",
      ) as HTMLElement;
      if (lineEl && startPosition) {
        const line =
          file.type === "code" ?
            parseInt(lineEl.dataset.line || "0", 10)
          : parseInt(lineEl.dataset.line || "0", 10) + 1;
        const col = calculateColumn(e, lineEl);
        let from = startPosition,
          to = { line, col };
        if (from.line > to.line || (from.line === to.line && from.col > to.col))
          [from, to] = [to, from];
        if (from.line !== to.line || Math.abs(from.col - to.col) > 0) {
          const selection = { from, to };
          setSelectionRange(selection);
          void selectionRange;
          onSelectionChange?.(selection);
          onSelectionMade?.();
        }
      }
      isMouseDown = false;
      startPosition = null;
      window.removeEventListener("mousemove", onMouseMove);
    };

    window.addEventListener("mousedown", onMouseDown);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [file.type, onSelectionMade]);

  function getAdjustedFeedbacks(
    content: string,
    feedbacks: FeedbackItem[],
  ): FeedbackItem[] {
    const rawLines = content.split(/\r?\n/);
    const lines = rawLines.map((l) => l.trimEnd());
    const totalLines = lines.length;

    return feedbacks.map((fb) => {
      if (fb.locationData?.type !== "text") return fb;

      let { fromLine, toLine, fromCol, toCol } = fb.locationData;
      fromCol = typeof fromCol === "number" ? fromCol : 0;
      toCol = typeof toCol === "number" ? toCol : 0;

      if (
        (fb.locationData.fromCol === undefined || fb.locationData.fromCol === 0) &&
        (fb.locationData.toCol === undefined || fb.locationData.toCol === 0)
      ) {
        fromCol = 0;
        toCol = lines[toLine - 1]?.length ?? 0;
      }

      if (typeof toLine === "number" && toLine > totalLines) {
        toLine = totalLines;
        toCol = lines[totalLines - 1]?.length ?? 0;
      }

      const fromLineLen = lines[fromLine! - 1]?.length ?? 0;
      const toLineLen = lines[toLine! - 1]?.length ?? 0;
      const adjustedFromCol = Math.max(0, Math.min(fromCol, fromLineLen));
      const adjustedToCol = Math.max(0, Math.min(toCol, toLineLen));

      return {
        ...fb,
        locationData: {
          ...fb.locationData,
          fromLine,
          toLine,
          fromCol: adjustedFromCol,
          toCol: adjustedToCol,
        },
      };
    });
  }

  useEffect(() => {
    const adjusted = getAdjustedFeedbacks(file.content, feedbacks);
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
  }, [file.content, feedbacks, updateFeedback, updateLastSavedData, formData]);

  useEffect(() => {
    if (!activeFeedbackId) {
      setTooltipFb(null);
      setStartLineElement(null);
      setEndLineElement(null);
      return;
    }

    const fb = feedbacks.find((f) => f.id === activeFeedbackId);
    if (
      fb &&
      fb.locationData?.type === "text" &&
      typeof fb.locationData.fromLine === "number"
    ) {
      const tryScroll = () => {
        if (file.type === "code") {
          const root = document.getElementById(`shiki-container`);
          if (!root) return;

          if (
            fb.locationData.type === "text" &&
            typeof fb.locationData.fromLine === "number"
          ) {
            const startEl = root.querySelector(
              `.line[data-line="${fb.locationData.fromLine}"]`,
            );
            const endEl = root.querySelector(
              `.line[data-line="${fb.locationData.toLine}"]`,
            );

            if (startEl) {
              const lineRect = (startEl as HTMLElement).getBoundingClientRect();
              const rootRect = root.getBoundingClientRect();
              const scrollTop = root.scrollTop + (lineRect.top - rootRect.top) - 120;

              root.scrollTo({
                top: scrollTop,
                behavior: "smooth",
              });

              // Set tooltip and elements after scroll completes
              setStartLineElement(null);
              setEndLineElement(null);
              setTooltipFb(null);

              setTimeout(() => {
                setStartLineElement(startEl as HTMLElement);
                setEndLineElement(endEl as HTMLElement);
                setTooltipFb(fb);
              }, 100); // Wait for smooth scroll to complete
            }
          }
        }
      };

      setTimeout(tryScroll, 0);
    }
  }, [activeFeedbackId, feedbacks, file.type]);

  const renderContent = () => {
    const validFeedbacks = getAdjustedFeedbacks(file.content, feedbacks);

    if (file.type === "code") {
      const getShikiTheme = () => (theme === "dark" ? "github-dark" : "github-light");

      return (
        <ShikiHighlighter
          language={language}
          theme={getShikiTheme()}
          addDefaultStyles
          showLanguage={false}
          className="h-full w-full overflow-auto"
          transformers={[
            {
              preprocess(_, options) {
                let decorations = validFeedbacks
                  .filter(
                    (
                      fb,
                    ): fb is FeedbackItem & {
                      locationData: {
                        type: "text";
                        fromLine: number;
                        toLine: number;
                        fromCol?: number;
                        toCol?: number;
                      };
                    } =>
                      fb.locationData?.type === "text" &&
                      typeof fb.locationData.fromLine === "number" &&
                      typeof fb.locationData.toLine === "number",
                  )
                  .map((fb) => {
                    const feedbackId = fb.id;
                    let fromLine = fb.locationData.fromLine;
                    let toLine = fb.locationData.toLine;
                    let fromCol =
                      typeof fb.locationData.fromCol === "number" ?
                        fb.locationData.fromCol
                      : 0;
                    let toCol =
                      typeof fb.locationData.toCol === "number" ?
                        fb.locationData.toCol
                      : 0;

                    if (fromLine === toLine && fromCol === toCol) {
                      toLine = fromLine + 1;
                    }

                    return {
                      fb: {
                        ...fb,
                        locationData: {
                          ...fb.locationData,
                          fromLine,
                          toLine,
                          fromCol,
                          toCol,
                        },
                      },
                      feedbackId,
                    };
                  });

                if (activeFeedbackId !== undefined && activeFeedbackId !== null) {
                  decorations = decorations.filter(
                    ({ feedbackId }) => feedbackId === activeFeedbackId,
                  );
                }

                options.decorations = decorations.map(({ fb, feedbackId }) => ({
                  start: {
                    line: fb.locationData.fromLine - 1,
                    character:
                      typeof fb.locationData.fromCol === "number" ?
                        fb.locationData.fromCol
                      : 0,
                  },
                  end: {
                    line: fb.locationData.toLine - 1,
                    character:
                      typeof fb.locationData.toCol === "number" ?
                        fb.locationData.toCol
                      : 0,
                  },
                  properties: {
                    class:
                      "annotation-span" +
                      (activeFeedbackId && feedbackId === activeFeedbackId ?
                        " annotation-span-focused"
                      : ""),
                    "data-id": feedbackId,
                    "data-tag": fb.tag,
                  },
                }));
              },
              line(node, lineIndex) {
                node.properties = {
                  ...node.properties,
                  "data-line": lineIndex.toString(),
                };
              },
              pre(node) {
                node.properties = {
                  ...node.properties,
                  style: "background: var(--background)",
                };
              },
            },
          ]}
        >
          {file.content}
        </ShikiHighlighter>
      );
    }
  };

  return (
    <>
      {renderContent()}
      {tooltipFb && (
        <FeedbackTooltip
          fb={tooltipFb}
          startEl={startLineElement}
          endEl={endLineElement}
        />
      )}
    </>
  );
};

export default HighlightableViewer;
