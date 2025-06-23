import React, { useState, useEffect } from "react";
import ShikiHighlighter from "react-shiki";
import { FeedbackItem } from "@/types/assessment";
import { useTheme } from "@/context/theme-provider";
import { Button } from "@/components/ui/button";
import "./viewer.css";

interface HighlightableViewerProps {
  type: "code" | "essay";
  content: string; // Nhận content trực tiếp
  feedbacks: FeedbackItem[];
  updateFeedback: (newFeedbacks: FeedbackItem[]) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  activeFeedbackId?: string | null;
  fileUrl?: string;
  rubricCriteria?: string[];
}
export default function HighlightableViewer({
  type,
  content,
  feedbacks,
  updateFeedback,
  isHighlightMode,
  onHighlightComplete,
  activeFeedbackId,
  fileUrl,
  rubricCriteria = [],
}: HighlightableViewerProps) {
  const { theme = "light" } = useTheme?.() || {};
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newFeedbackTag, setNewFeedbackTag] = useState<string>("info");
  const [selectionRange, setSelectionRange] = useState<{
    from: { line: number; col: number };
    to: { line: number; col: number };
  } | null>(null);
  const [newCriterion, setNewCriterion] = useState<string>("");

  // Determine language from fileUrl
  let language = "plaintext";
  if (fileUrl) {
    const ext = fileUrl.split(".").pop()?.toLowerCase() || "";
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
      }[ext] ||
      ext ||
      "plaintext";
  }

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
      // Nếu click vào ngoài text node (khoảng trắng đầu dòng), trả về 0
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
        type === "code" ? ".line" : "[data-line]",
      ) as HTMLElement;
      if (!lineEl) return;
      isMouseDown = true;
      mouseMoved = false;
      // Tách logic lấy số dòng cho code và essay
      const line =
        type === "code" ?
          parseInt(lineEl.dataset.line || "0", 10) // code: zero-based
        : parseInt(lineEl.dataset.line || "0", 10) + 1; // essay: one-based
      const col = calculateColumn(e, lineEl); // col luôn từ 0
      startPosition = { line, col };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp, { once: true });
    };
    const onMouseMove = () => {
      if (isMouseDown) mouseMoved = true;
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const lineEl = (e.target as HTMLElement).closest(
        type === "code" ? ".line" : "[data-line]",
      ) as HTMLElement;
      if (lineEl && startPosition) {
        const line =
          type === "code" ?
            parseInt(lineEl.dataset.line || "0", 10)
          : parseInt(lineEl.dataset.line || "0", 10) + 1;
        const col = calculateColumn(e, lineEl);
        let from = startPosition,
          to = { line, col };
        if (from.line > to.line || (from.line === to.line && from.col > to.col))
          [from, to] = [to, from];
        if (from.line !== to.line || Math.abs(from.col - to.col) > 0) {
          setSelectionRange({ from, to });
          setIsDialogOpen(true);
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
      // mouseup is once:true
    };
  }, [isHighlightMode, type]);

  // --- Add feedback ---
  const addFeedback = () => {
    if (!selectionRange || !newComment.trim() || !newCriterion) return;
    const { from, to } = selectionRange;
    let fileRef = "";
    if (fileUrl) {
      fileRef = fileUrl.split("/").pop() || "";
    }
    const newFeedback: FeedbackItem = {
      criterion: newCriterion,
      fileRef,
      fromLine: Math.min(from.line, to.line),
      toLine: Math.max(from.line, to.line),
      fromCol: Math.min(from.col, to.col),
      toCol: Math.max(from.col, to.col),
      comment: newComment.trim(),
      tag: newFeedbackTag,
    };
    updateFeedback([newFeedback]);
    setNewComment("");
    setNewFeedbackTag("info");
    setNewCriterion("");
    setSelectionRange(null);
    setIsDialogOpen(false);
    onHighlightComplete();
  };

  // --- Render content ---
  let visibleFeedbacks = feedbacks;
  const renderContent = () => {
    if (type === "code") {
      const getShikiTheme = () => (theme === "dark" ? "github-dark" : "github-light");
      return (
        <ShikiHighlighter
          language={language}
          theme={getShikiTheme()}
          addDefaultStyles
          showLanguage={false}
          className="h-full overflow-y-auto"
          transformers={[
            {
              preprocess(code, options) {
                let decorations = visibleFeedbacks
                  .map((fb, idx) => {
                    // Nếu fromLine == toLine và fromCol == toCol thì tăng toLine lên 1
                    let fromLine = fb.fromLine!;
                    let toLine = fb.toLine!;
                    let fromCol = fb.fromCol!;
                    let toCol = fb.toCol!;
                    if (
                      typeof fromLine === "number" &&
                      typeof toLine === "number" &&
                      typeof fromCol === "number" &&
                      typeof toCol === "number" &&
                      fromLine === toLine &&
                      fromCol === toCol
                    ) {
                      toLine = fromLine + 1;
                    }
                    return { fb: { ...fb, fromLine, toLine, fromCol, toCol }, idx };
                  })
                  .filter(
                    ({ fb }) =>
                      typeof fb.fromLine === "number" &&
                      typeof fb.toLine === "number" &&
                      typeof fb.fromCol === "number" &&
                      typeof fb.toCol === "number",
                  );
                // Nếu có activeFeedbackId, chỉ giữ decoration của feedback đó
                if (activeFeedbackId !== undefined && activeFeedbackId !== null) {
                  decorations = decorations.filter(
                    ({ idx }) => String(idx) === String(activeFeedbackId),
                  );
                }
                options.decorations = decorations.map(({ fb, idx }) => ({
                  start: {
                    line: fb.fromLine! - 1,
                    character: fb.fromCol!,
                  },
                  end: {
                    line: fb.toLine! - 1,
                    character: fb.toCol!,
                  },
                  properties: {
                    class:
                      "annotation-span" +
                      (activeFeedbackId && String(idx) === String(activeFeedbackId) ?
                        " annotation-span-focused"
                      : ""),
                    "data-id": String(idx),
                    "data-comment": fb.comment,
                    "data-tag": fb.tag,
                    "data-criterion": fb.criterion,
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
    function getFeedbackGroupsForLine(lineIdx: number, lineLength: number) {
      const boundaries: {
        pos: number;
        type: "start" | "end";
        fb: FeedbackItem;
        idx: number;
      }[] = [];
      visibleFeedbacks.forEach((fb, idx) => {
        if (
          typeof fb.fromCol !== "number" ||
          typeof fb.toCol !== "number" ||
          typeof fb.fromLine !== "number"
        ) {
          return;
        }
        if (lineIdx + 1 !== fb.fromLine) return;
        const start = fb.fromCol;
        const end = fb.toCol;
        if (start < end) {
          boundaries.push({ pos: start, type: "start", fb, idx });
          boundaries.push({ pos: end, type: "end", fb, idx });
        }
      });
      boundaries.sort((a, b) => a.pos - b.pos || (a.type === "end" ? -1 : 1));
      const segments: {
        start: number;
        end: number;
        feedbacks: { fb: FeedbackItem; idx: number }[];
      }[] = [];
      let active: { fb: FeedbackItem; idx: number }[] = [];
      let lastPos = 0;
      for (const b of boundaries) {
        if (b.pos > lastPos) {
          segments.push({ start: lastPos, end: b.pos, feedbacks: [...active] });
        }
        if (b.type === "start") active.push({ fb: b.fb, idx: b.idx });
        else active = active.filter((f) => f.fb !== b.fb);
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
          if (line === "") {
            return (
              <div key={i} data-line={i}>
                <br />
              </div>
            );
          }
          const segments = getFeedbackGroupsForLine(i, line.length);
          return (
            <div key={i} data-line={i}>
              {segments.map((seg, idx) => {
                let inner: React.ReactNode = line.slice(seg.start, seg.end);
                // Nếu có activeFeedbackId, chỉ highlight feedback đó, các feedback khác không có class actived
                if (activeFeedbackId !== undefined && activeFeedbackId !== null) {
                  // Tìm feedback đang active trong seg.feedbacks
                  const activeFb = seg.feedbacks.find(
                    (f) => String(f.idx) === String(activeFeedbackId),
                  );
                  if (activeFb) {
                    // Chỉ wrap đoạn text này bằng span actived cho feedback active
                    inner = (
                      <span
                        key={
                          (activeFb.fb.fileRef || "") +
                          "-" +
                          (activeFb.fb.fromLine ?? "") +
                          "-" +
                          (activeFb.fb.toLine ?? "") +
                          "-" +
                          (activeFb.fb.criterion ?? "") +
                          "-" +
                          (activeFb.fb.comment ?? "") +
                          "-" +
                          idx +
                          "-active"
                        }
                        className={
                          "annotation-span actived annotation-span-focused " +
                          (seg.feedbacks.length === 1 ? "highlight-top" : "")
                        }
                        data-id={String(activeFb.idx)}
                        data-comment={activeFb.fb.comment}
                        data-tag={activeFb.fb.tag}
                      >
                        {inner}
                      </span>
                    );
                  }
                  // Nếu không phải feedback active thì không wrap gì cả (bỏ highlight các feedback khác)
                } else {
                  // Không có feedback nào active, highlight tất cả như cũ
                  seg.feedbacks.forEach((f, fbIdx) => {
                    inner = (
                      <span
                        key={
                          (f.fb.fileRef || "") +
                          "-" +
                          (f.fb.fromLine ?? "") +
                          "-" +
                          (f.fb.toLine ?? "") +
                          "-" +
                          (f.fb.criterion ?? "") +
                          "-" +
                          (f.fb.comment ?? "") +
                          "-" +
                          idx +
                          "-" +
                          fbIdx
                        }
                        className={
                          "annotation-span " +
                          (fbIdx === seg.feedbacks.length - 1 ?
                            "highlight-top"
                          : "highlight-under")
                        }
                        data-id={String(f.idx)}
                        data-comment={f.fb.comment}
                        data-tag={f.fb.tag}
                      >
                        {inner}
                      </span>
                    );
                  });
                }
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
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Select Criterion:</label>
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
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                className="mr-2"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewComment("");
                  setNewFeedbackTag("info");
                  setNewCriterion("");
                  setSelectionRange(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={addFeedback}
                disabled={!newComment.trim() || !newCriterion}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
