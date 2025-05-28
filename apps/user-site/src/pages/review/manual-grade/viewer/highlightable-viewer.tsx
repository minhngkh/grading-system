import React, { useState, useEffect } from "react";
import ShikiHighlighter from "react-shiki";
import { Feedback } from "@/types/submission";
import { useTheme } from "@/context/theme-provider";
import { Button } from "@/components/ui/button";
import "./viewer.css";

interface HighlightableViewerProps {
  type: "code" | "essay";
  content: string;
  feedbacks: Feedback[];
  updateFeedback: (newFeedbacks: Feedback[]) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  activeFeedbackId?: string | null;
}

export default function HighlightableViewer({
  type,
  content,
  feedbacks,
  updateFeedback,
  isHighlightMode,
  onHighlightComplete,
  activeFeedbackId,
}: HighlightableViewerProps) {
  const { theme = "light" } = useTheme?.() || {};
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newFeedbackTag, setNewFeedbackTag] = useState<
    "info" | "notice" | "tip" | "caution"
  >("info");
  const [selectionRange, setSelectionRange] = useState<{
    from: { line: number; col: number };
    to: { line: number; col: number };
  } | null>(null);

  // --- Highlight selection logic ---
  useEffect(() => {
    if (!isHighlightMode) return;
    let isMouseDown = false,
      mouseMoved = false,
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
      const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT, null);
      let charCount = 0,
        node = walker.nextNode() as Text | null;
      while (node) {
        if (node === range.startContainer) {
          charCount += range.startOffset;
          break;
        }
        charCount += node.textContent?.length ?? 0;
        node = walker.nextNode() as Text | null;
      }
      return charCount;
    };

    const onMouseDown = (e: MouseEvent) => {
      const lineEl = (e.target as HTMLElement).closest(
        type === "code" ? ".line" : "[data-line]",
      ) as HTMLElement;
      if (!lineEl) return;
      isMouseDown = true;
      mouseMoved = false;
      const lineZero =
        parseInt(lineEl.dataset.line || "0", 10) - (type === "code" ? 1 : 0);
      const col = calculateColumn(e, lineEl);
      startPosition = { line: lineZero, col };
      document.addEventListener("mousemove", onMouseMove);
    };
    const onMouseMove = () => {
      if (isMouseDown) mouseMoved = true;
    };
    const onMouseUp = (e: MouseEvent) => {
      if (isMouseDown && mouseMoved && startPosition) {
        const lineEl = (e.target as HTMLElement).closest(
          type === "code" ? ".line" : "[data-line]",
        ) as HTMLElement;
        if (lineEl) {
          const lineZero =
            parseInt(lineEl.dataset.line || "0", 10) - (type === "code" ? 1 : 0);
          const col = calculateColumn(e, lineEl);
          let from = startPosition,
            to = { line: lineZero, col };
          if (from.line > to.line || (from.line === to.line && from.col > to.col))
            [from, to] = [to, from];
          setSelectionRange({ from, to });
          setIsDialogOpen(true);
        }
      }
      isMouseDown = false;
      startPosition = null;
      document.removeEventListener("mousemove", onMouseMove);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [isHighlightMode, type]);

  // --- Feedback hover effect ---
  useEffect(() => {
    const onMouseEnter = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".annotation-span") as HTMLElement;
      if (target) {
        const id = target.getAttribute("data-id");
        document
          .querySelectorAll(`.annotation-span[data-id="${id}"]`)
          .forEach((el) => el.classList.add("hovered"));
      }
    };
    const onMouseLeave = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".annotation-span") as HTMLElement;
      if (target) {
        const id = target.getAttribute("data-id");
        document
          .querySelectorAll(`.annotation-span[data-id="${id}"]`)
          .forEach((el) => el.classList.remove("hovered"));
      }
    };
    document.addEventListener("mouseover", onMouseEnter);
    document.addEventListener("mouseout", onMouseLeave);
    return () => {
      document.removeEventListener("mouseover", onMouseEnter);
      document.removeEventListener("mouseout", onMouseLeave);
    };
  }, []);

  // --- Add feedback ---
  const addFeedback = () => {
    if (!selectionRange || !newComment.trim()) return;
    const { from, to } = selectionRange;
    const newFeedback = {
      id: `${Date.now()}`,
      comment: newComment.trim(),
      tag: newFeedbackTag,
      DocumentLocation: {
        id: `${Date.now()}`,
        fromLine: from.line,
        toLine: to.line,
        fromCol: from.col,
        toCol: to.col,
      },
    };
    updateFeedback([newFeedback]);
    setNewComment("");
    setNewFeedbackTag("info");
    setSelectionRange(null);
    setIsDialogOpen(false);
    onHighlightComplete();
  };

  // --- Render content ---
  const renderContent = () => {
    // Nếu có activeFeedbackId và không ở highlight mode, chỉ render feedback đó
    const visibleFeedbacks =
      activeFeedbackId && !isHighlightMode
        ? feedbacks.filter((fb) => fb.id === activeFeedbackId)
        : feedbacks;

    if (type === "code") {
      const getShikiTheme = () => (theme === "dark" ? "github-dark" : "github-light");
      return (
        <ShikiHighlighter
          language="ts"
          // theme={getShikiTheme()}
          theme={getShikiTheme()}
          addDefaultStyles
          showLanguage={false}
          className="h-full"
          transformers={[
            {
              preprocess(code, options) {
                options.decorations = visibleFeedbacks.map((fb) => ({
                  start: {
                    line: fb.DocumentLocation.fromLine,
                    character: fb.DocumentLocation.fromCol,
                  },
                  end: {
                    line: fb.DocumentLocation.toLine,
                    character: fb.DocumentLocation.toCol,
                  },
                  properties: {
                    class:
                      "annotation-span" +
                      (activeFeedbackId && fb.id === activeFeedbackId
                        ? " annotation-span-focused"
                        : ""),
                    "data-id": fb.id,
                    "data-comment": fb.comment,
                    "data-tag": fb.tag,
                  },
                }));
              },
              pre(node) {
                node.properties = {
                  backgroundColor: "oklch(0.129 0.042 264.69)",
                };
              },
              line(node, lineIndex) {
                node.properties = {
                  ...node.properties,
                  "data-line": lineIndex.toString(),
                };
              },
            },
          ]}
        >
          {content}
        </ShikiHighlighter>
      );
    }
    // Essay
    // Overlapping highlights: mỗi đoạn có thể có nhiều feedback, mỗi feedback là 1 span lồng nhau, mỗi span có class riêng
    function getFeedbackGroupsForLine(lineIdx: number, lineLength: number) {
      // Build all feedback boundaries (start/end) for this line
      const boundaries: { pos: number; type: "start" | "end"; fb: Feedback }[] = [];
      // Sử dụng visibleFeedbacks thay vì feedbacks
      visibleFeedbacks.forEach((fb) => {
        const { fromLine, toLine, fromCol, toCol } = fb.DocumentLocation;
        if (lineIdx < fromLine || lineIdx > toLine) return;
        const start = lineIdx === fromLine ? fromCol : 0;
        const end = lineIdx === toLine ? toCol : lineLength;
        if (start < end) {
          boundaries.push({ pos: start, type: "start", fb });
          boundaries.push({ pos: end, type: "end", fb });
        }
      });
      boundaries.sort((a, b) => a.pos - b.pos || (a.type === "end" ? -1 : 1));
      const segments: { start: number; end: number; feedbacks: Feedback[] }[] = [];
      let active: Feedback[] = [];
      let lastPos = 0;
      for (const b of boundaries) {
        if (b.pos > lastPos) {
          segments.push({ start: lastPos, end: b.pos, feedbacks: [...active] });
        }
        if (b.type === "start") active.push(b.fb);
        else active = active.filter((f) => f !== b.fb);
        lastPos = b.pos;
      }
      if (lastPos < lineLength) {
        segments.push({ start: lastPos, end: lineLength, feedbacks: [...active] });
      }
      return segments;
    }

    return (
      <div className="font-serif text-md leading-relaxed whitespace-pre-wrap p-3">
        {content.split("\n").map((line, i) => {
          const segments = getFeedbackGroupsForLine(i, line.length);
          return (
            <div key={i} data-line={i}>
              {segments.map((seg, idx) => {
                let inner: React.ReactNode = line.slice(seg.start, seg.end);
                // Lồng từng feedback một, mỗi feedback một class riêng biệt
                seg.feedbacks.forEach((fb, fbIdx) => {
                  inner = (
                    <span
                      key={fb.id + "-" + idx + "-" + fbIdx}
                      className={
                        "annotation-span" +
                        (activeFeedbackId && fb.id === activeFeedbackId
                          ? " annotation-span-focused"
                          : "") +
                        " " +
                        (fbIdx === seg.feedbacks.length - 1
                          ? "highlight-top"
                          : "highlight-under")
                      }
                      data-id={fb.id}
                      data-comment={fb.comment}
                      data-tag={fb.tag}
                    >
                      {inner}
                    </span>
                  );
                });
                return inner;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // --- Render dialog ---
  return (
    <>
      {renderContent()}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96 z-50">
            <h2 className="text-lg font-bold mb-4">Add Feedback</h2>
            <textarea
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              rows={4}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your feedback..."
            />
            <div className="mt-4">
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
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                className="mr-2"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewComment("");
                  setNewFeedbackTag("info");
                  setSelectionRange(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={addFeedback} disabled={!newComment.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
