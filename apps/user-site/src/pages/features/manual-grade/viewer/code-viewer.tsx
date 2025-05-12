// AnnotatedShikiDemo.tsx
import React, { useState } from "react";
import ShikiHighlighter from "react-shiki";
import "./viewer.css";
import { Feedback } from "@/types/submission";
import { useTheme } from "@/context/theme-provider";
import { Button } from "@/components/ui/button";

export interface CodeViewerProps {
  code: string;
  feedbacks: Feedback[];
  updateFeedback: (newFeedbacks: Feedback[]) => void;
  isHighlightMode: boolean; // New prop to enable highlight mode
  onHighlightComplete: () => void; // Callback to reset highlight mode
}

export default function CodeHighlighter({
  code,
  feedbacks,
  updateFeedback,
  isHighlightMode,
  onHighlightComplete,
}: CodeViewerProps) {
  const { theme } = useTheme(); // Get the current theme from the ThemeProvider
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newFeedbackTag, setNewFeedbackTag] = useState<
    "info" | "notice" | "tip" | "caution"
  >("info");
  const [selectionRange, setSelectionRange] = useState<{
    from: { line: number; col: number };
    to: { line: number; col: number };
  } | null>(null);

  const addFeedback = () => {
    if (!selectionRange || !newComment.trim()) return;
    const { from, to } = selectionRange;
    const newFeedback = {
      id: `${Date.now()}`,
      comment: newComment.trim(),
      tag: newFeedbackTag, // Add tag to feedback
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
    setNewFeedbackTag("info"); // Reset tag
    setSelectionRange(null);
    setIsDialogOpen(false);
    onHighlightComplete();
  };

  React.useEffect(() => {
    if (!isHighlightMode) return;

    let isMouseDown = false;
    let mouseMoved = false;
    let startPosition: { line: number; col: number } | null = null;

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
      const lineEl = (e.target as HTMLElement).closest(".line") as HTMLElement;
      if (!lineEl) return;
      isMouseDown = true;
      mouseMoved = false;
      const lineZero = parseInt(lineEl.dataset.line || "0", 10) - 1;
      const col = calculateColumn(e, lineEl);
      startPosition = { line: lineZero, col };
      document.addEventListener("mousemove", onMouseMove);
    };

    const onMouseMove = () => {
      if (isMouseDown) mouseMoved = true;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isMouseDown && mouseMoved && startPosition) {
        const lineEl = (e.target as HTMLElement).closest(".line") as HTMLElement;
        if (lineEl) {
          const lineZero = parseInt(lineEl.dataset.line || "0", 10) - 1;
          const col = calculateColumn(e, lineEl);
          let from = startPosition;
          let to = { line: lineZero, col };
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
  }, [isHighlightMode]);

  const getShikiTheme = () => {
    if (theme === "dark") return "material-theme-ocean";
    return "github-light";
  };

  return (
    <>
      <ShikiHighlighter
        language="ts"
        theme={getShikiTheme()} // Dynamically set theme based on the current theme
        addDefaultStyles
        showLanguage={false}
        className="h-full"
        transformers={[
          {
            preprocess(code, options) {
              options.decorations = feedbacks.map((fb) => ({
                start: {
                  line: fb.DocumentLocation.fromLine,
                  character: fb.DocumentLocation.fromCol,
                },
                end: {
                  line: fb.DocumentLocation.toLine,
                  character: fb.DocumentLocation.toCol,
                },
                properties: {
                  class: "annotation-span",
                  "data-id": fb.id,
                  "data-comment": fb.comment,
                  "data-tag": fb.tag, // Add tag attribute
                },
              }));
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
        {code}
      </ShikiHighlighter>

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
