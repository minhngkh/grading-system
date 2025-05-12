import { Feedback } from "@/types/submission";
import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import "./viewer.css";

interface EssayHighlighterProps {
  essay: string;
  feedbacks: Feedback[];
  updateFeedback: (criterionId: string, newFeedbacks: Feedback[]) => void; // Include criterionId
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  criterionId: string; // Add criterionId prop
}

export function EssayHighlighter({
  essay,
  feedbacks,
  updateFeedback,
  isHighlightMode,
  onHighlightComplete,
  criterionId, // Destructure criterionId
}: EssayHighlighterProps) {
  const essayRef = useRef<HTMLDivElement>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newFeedbackTag, setNewFeedbackTag] = useState<
    "info" | "notice" | "tip" | "caution"
  >("info");
  const [selectionRange, setSelectionRange] = useState<{
    from: { line: number; col: number };
    to: { line: number; col: number };
  } | null>(null);

  const handleAddFeedback = () => {
    if (!selectionRange || !newComment.trim()) return;
    const { from, to } = selectionRange;
    const newFeedback = {
      id: uuidv4(),
      comment: newComment.trim(),
      tag: newFeedbackTag,
      DocumentLocation: {
        id: uuidv4(),
        fromLine: from.line,
        toLine: to.line,
        fromCol: from.col,
        toCol: to.col,
      },
    };
    updateFeedback(criterionId, [newFeedback]);
    setNewComment("");
    setNewFeedbackTag("info");
    setSelectionRange(null);
    setIsDialogOpen(false);
    onHighlightComplete();
  };

  const addFeedback = (
    from: { line: number; col: number },
    to: { line: number; col: number },
    comment: string,
  ) => {
    const newFeedback = {
      id: uuidv4(),
      comment,
      DocumentLocation: {
        id: uuidv4(),
        fromLine: from.line,
        toLine: to.line,
        fromCol: from.col,
        toCol: to.col,
      },
    };
    updateFeedback(criterionId, [newFeedback]); // Pass criterionId with feedback
    onHighlightComplete();
  };

  useEffect(() => {
    if (!isHighlightMode) return;

    let isMouseDown = false;
    let mouseMoved = false;
    let startPosition: { line: number; col: number } | null = null;

    const calculateColumn = (e: MouseEvent, lineEl: HTMLElement): number => {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (!range) return 0;

      const walker = document.createTreeWalker(lineEl, NodeFilter.SHOW_TEXT, null);
      let charCount = 0;
      let node = walker.nextNode() as Text | null;
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
      const lineEl = (e.target as HTMLElement).closest("[data-line]") as HTMLElement;
      if (!lineEl) return;
      isMouseDown = true;
      mouseMoved = false;
      const line = parseInt(lineEl.dataset.line || "0", 10);
      const col = calculateColumn(e, lineEl);
      startPosition = { line, col };
      document.addEventListener("mousemove", onMouseMove);
    };

    const onMouseMove = () => {
      if (isMouseDown) mouseMoved = true;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isMouseDown && mouseMoved && startPosition) {
        const lineEl = (e.target as HTMLElement).closest("[data-line]") as HTMLElement;
        if (lineEl) {
          const line = parseInt(lineEl.dataset.line || "0", 10);
          const col = calculateColumn(e, lineEl);
          let from = startPosition;
          let to = { line, col };
          if (from.line > to.line || (from.line === to.line && from.col > to.col)) {
            [from, to] = [to, from];
          }
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
  }, [isHighlightMode, feedbacks]);

  const renderLine = (line: string, lineIdx: number) => {
    const out: React.ReactNode[] = [];
    let idx = 0;

    while (idx < line.length) {
      // Find the next feedback that overlaps with this line and position
      const fb = feedbacks.find((f) => {
        const loc = f.DocumentLocation;
        return (
          (lineIdx > loc.fromLine || (lineIdx === loc.fromLine && idx >= loc.fromCol)) &&
          (lineIdx < loc.toLine || (lineIdx === loc.toLine && idx < loc.toCol))
        );
      });

      if (!fb) {
        // No feedback for this character, find the next feedback start or end of line
        const nextFeedbackStart = feedbacks
          .map((f) => f.DocumentLocation)
          .filter((loc) => loc.fromLine === lineIdx && loc.fromCol > idx)
          .map((loc) => loc.fromCol)
          .sort((a, b) => a - b)[0];
        const endIdx = nextFeedbackStart !== undefined ? nextFeedbackStart : line.length;
        out.push(line.slice(idx, endIdx));
        idx = endIdx;
      } else {
        // Feedback exists, wrap the relevant section in a span
        const loc = fb.DocumentLocation;
        const start = lineIdx === loc.fromLine ? Math.max(idx, loc.fromCol) : idx;
        const end = lineIdx === loc.toLine ? loc.toCol : line.length;
        out.push(
          <span
            key={`${fb.id}-${lineIdx}-${start}`}
            className="annotation-span bg-yellow-200 dark:bg-yellow-700 cursor-pointer"
            data-id={fb.id}
            data-comment={fb.comment}
            data-tag={fb.tag} // Add tag attribute
          >
            {line.slice(start, end)}
          </span>,
        );
        idx = end;
      }
    }

    return out;
  };

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

  return (
    <>
      <div
        ref={essayRef}
        className="font-serif text-md leading-relaxed whitespace-pre-wrap p-3"
      >
        {essay.split("\n").map((line, i) => (
          <div key={i} data-line={i}>
            {renderLine(line, i)}
          </div>
        ))}
      </div>

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
                onChange={(e) =>
                  setNewFeedbackTag(
                    e.target.value as "info" | "notice" | "tip" | "caution",
                  )
                }
              >
                <option value="info">Info</option>
                <option value="notice">Notice</option>
                <option value="tip">Tip</option>
                <option value="caution">Caution</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="mr-2 px-4 py-2 border rounded bg-gray-200 dark:bg-gray-700"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewComment("");
                  setNewFeedbackTag("info");
                  setSelectionRange(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border rounded bg-blue-500 text-white"
                onClick={handleAddFeedback}
                disabled={!newComment.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
