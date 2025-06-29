import React, { useState, useEffect, forwardRef } from "react";
import ShikiHighlighter from "react-shiki";
import { FeedbackItem } from "@/types/assessment";
import { useTheme } from "@/context/theme-provider";
import { Button } from "@/components/ui/button";
import "./viewer.css";
import { FileItem } from "@/types/file";

interface HighlightableViewerProps {
  file: FileItem;
  feedbacks: FeedbackItem[];
  feedbacksAll?: FeedbackItem[]; // Thêm prop này
  updateFeedback: (index: number, adjustedFeedback: FeedbackItem) => void;
  addFeedback: (newFeedback: FeedbackItem) => void;
  isHighlightMode: boolean;
  onHighlightComplete: () => void;
  activeFeedbackId?: string | null;
  rubricCriteria?: string[];
  gradingId: string;
  submissionReference: string;
}

// Thêm interface cho ref
export interface HighlightableViewerHandle {
  scrollToLine: (line: number) => void;
}

const HighlightableViewer = forwardRef<
  HighlightableViewerHandle,
  HighlightableViewerProps
>(function HighlightableViewer({
  file,
  feedbacks,
  feedbacksAll = [],
  addFeedback,
  updateFeedback,
  isHighlightMode,
  onHighlightComplete,
  activeFeedbackId,
  rubricCriteria = [],
  gradingId,
  submissionReference,
}) {
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
      }[file.extension] ||
      file.extension ||
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
        file.type === "code" ? ".line" : "[data-line]",
      ) as HTMLElement;
      if (!lineEl) return;
      isMouseDown = true;
      mouseMoved = false;
      // Tách logic lấy số dòng cho code và essay
      const line =
        file.type === "code" ?
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
  }, [isHighlightMode, file.type]);

  // Validate and adjust feedbacks of type "text"
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
      // Nếu chỉ có fromLine/toLine, thì fromCol = 0, toCol = chiều dài dòng toLine
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
    for (let i = 0; i < adjusted.length; i++) {
      if (JSON.stringify(adjusted[i]) !== JSON.stringify(feedbacks[i])) {
        const globalIdx = feedbacksAll.findIndex(
          (f) =>
            f.fileRef === feedbacks[i].fileRef &&
            f.criterion === feedbacks[i].criterion &&
            f.comment === feedbacks[i].comment &&
            JSON.stringify(f.locationData) === JSON.stringify(feedbacks[i].locationData),
        );

        if (globalIdx !== -1) {
          updateFeedback(globalIdx, adjusted[i]);
        }
      }
    }
  }, [file.content, feedbacks]);
  const handleAddFeedback = () => {
    if (!selectionRange || !newComment.trim() || !newCriterion) return;
    const { from, to } = selectionRange;
    let fileRef = `${gradingId}/${submissionReference}/${file.relativePath || ""}`;
    const newFeedback: FeedbackItem = {
      criterion: newCriterion,
      fileRef,
      comment: newComment.trim(),
      tag: newFeedbackTag,
      locationData: {
        type: "text",
        fromLine: Math.min(from.line, to.line),
        toLine: Math.max(from.line, to.line),
        fromCol: Math.min(from.col, to.col),
        toCol: Math.max(from.col, to.col),
      },
    };
    addFeedback(newFeedback);

    setNewComment("");
    setNewFeedbackTag("info");
    setNewCriterion("");
    setSelectionRange(null);
    setIsDialogOpen(false);
    onHighlightComplete();
  };

  useEffect(() => {
    if (
      activeFeedbackId !== undefined &&
      activeFeedbackId !== null &&
      feedbacksAll &&
      feedbacksAll.length > 0
    ) {
      const idx = Number(activeFeedbackId);
      const fb = feedbacksAll[idx];
      if (
        fb &&
        fb.fileRef === `${gradingId}/${submissionReference}/${file.relativePath || ""}` &&
        fb.locationData?.type === "text" &&
        typeof fb.locationData.fromLine === "number"
      ) {
        // Try to scroll, if not found, retry a few times (wait for DOM render)
        let tries = 9;
        const tryScroll = () => {
          const root = document.getElementById(`shiki-container`);
          if (
            root &&
            fb.locationData &&
            fb.locationData.type === "text" &&
            typeof fb.locationData.fromLine === "number"
          ) {
            const lineEl = root.querySelector(
              `.line[data-line="${fb.locationData.fromLine}"]`,
            );

            if (lineEl) {
              root.scrollTo({
                top: (lineEl as HTMLElement).offsetTop - root.offsetTop,
                behavior: "smooth",
              });
              return;
            }
          }
          if (tries < 10) {
            tries++;
            setTimeout(tryScroll, 100);
          }
        };
        setTimeout(tryScroll, 0);
      }
    }
  }, [activeFeedbackId, feedbacksAll, file.relativePath, gradingId, submissionReference]);

  // --- Render content ---
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
          className="h-full overflow-auto"
          transformers={[
            {
              preprocess(code, options) {
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
                    const globalIdx = feedbacksAll.findIndex(
                      (item) =>
                        item.fileRef === fb.fileRef &&
                        item.criterion === fb.criterion &&
                        item.comment === fb.comment &&
                        item.locationData?.type === "text" &&
                        JSON.stringify(item.locationData) ===
                          JSON.stringify(fb.locationData),
                    );
                    // fallback về 0 nếu fromCol/toCol undefined
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
                      globalIdx,
                    };
                  });
                if (activeFeedbackId !== undefined && activeFeedbackId !== null) {
                  decorations = decorations.filter(
                    ({ globalIdx }) => String(globalIdx) === String(activeFeedbackId),
                  );
                }
                options.decorations = decorations.map(({ fb, globalIdx }) => ({
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
                      ((
                        activeFeedbackId && String(globalIdx) === String(activeFeedbackId)
                      ) ?
                        " annotation-span-focused"
                      : ""),
                    "data-id": String(globalIdx),
                    "data-comment": fb.comment,
                    "data-tag": fb.tag,
                    "data-criterion": fb.criterion,
                  },
                }));
              },
              pre(node) {
                node.properties = {
                  overflow: "hidden",
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
          {file.content}
        </ShikiHighlighter>
      );
    }
    // Essay
    function getFeedbackGroupsForLine(lineIdx: number, lineLength: number) {
      const boundaries: {
        pos: number;
        type: "start" | "end";
        fb: FeedbackItem;
        globalIdx: number;
      }[] = [];
      validFeedbacks
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
        .forEach((fb) => {
          if (fb.locationData?.type !== "text") return;
          const globalIdx = feedbacksAll.findIndex(
            (item) =>
              item.fileRef === fb.fileRef &&
              item.criterion === fb.criterion &&
              item.comment === fb.comment &&
              item.locationData?.type === "text" &&
              JSON.stringify(item.locationData) === JSON.stringify(fb.locationData),
          );
          const fromCol =
            typeof fb.locationData.fromCol === "number" ? fb.locationData.fromCol : 0;
          const toCol =
            typeof fb.locationData.toCol === "number" ? fb.locationData.toCol : 0;
          const fromLine = fb.locationData.fromLine;
          if (lineIdx + 1 !== fromLine) return;
          const start = fromCol;
          const end = toCol;
          if (start < end) {
            boundaries.push({ pos: start, type: "start", fb, globalIdx });
            boundaries.push({ pos: end, type: "end", fb, globalIdx });
          }
        });
      boundaries.sort((a, b) => a.pos - b.pos || (a.type === "end" ? -1 : 1));
      const segments: {
        start: number;
        end: number;
        feedbacks: { fb: FeedbackItem; globalIdx: number }[];
      }[] = [];
      let active: { fb: FeedbackItem; globalIdx: number }[] = [];
      let lastPos = 0;
      for (const b of boundaries) {
        if (b.pos > lastPos) {
          segments.push({ start: lastPos, end: b.pos, feedbacks: [...active] });
        }
        if (b.type === "start") active.push({ fb: b.fb, globalIdx: b.globalIdx });
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
        {file.content.split("\n").map((line, i) => {
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
                    (f) => String(f.globalIdx) === String(activeFeedbackId),
                  );
                  if (activeFb) {
                    // Chỉ wrap đoạn text này bằng span actived cho feedback active
                    const fb = activeFb.fb;
                    let fromLine =
                      fb.locationData?.type === "text" ?
                        fb.locationData.fromLine
                      : undefined;
                    let toLine =
                      fb.locationData?.type === "text" ?
                        fb.locationData.toLine
                      : undefined;
                    inner = (
                      <span
                        key={
                          (fb.fileRef || "") +
                          "-" +
                          (fromLine ?? "") +
                          "-" +
                          (toLine ?? "") +
                          "-" +
                          (fb.criterion ?? "") +
                          "-" +
                          (fb.comment ?? "") +
                          "-" +
                          idx +
                          "-active"
                        }
                        className={
                          "annotation-span actived annotation-span-focused " +
                          (seg.feedbacks.length === 1 ? "highlight-top" : "")
                        }
                        data-id={String(activeFb.globalIdx)}
                        data-comment={fb.comment}
                        data-tag={fb.tag}
                      >
                        {inner}
                      </span>
                    );
                  }
                  // Nếu không phải feedback active thì không wrap gì cả (bỏ highlight các feedback khác)
                } else {
                  // Không có feedback nào active, highlight tất cả như cũ
                  seg.feedbacks.forEach((f, fbIdx) => {
                    const fb = f.fb;
                    let fromLine =
                      fb.locationData?.type === "text" ?
                        fb.locationData.fromLine
                      : undefined;
                    let toLine =
                      fb.locationData?.type === "text" ?
                        fb.locationData.toLine
                      : undefined;
                    inner = (
                      <span
                        key={
                          (fb.fileRef || "") +
                          "-" +
                          (fromLine ?? "") +
                          "-" +
                          (toLine ?? "") +
                          "-" +
                          (fb.criterion ?? "") +
                          "-" +
                          (fb.comment ?? "") +
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
                        data-id={String(f.globalIdx)}
                        data-comment={fb.comment}
                        data-tag={fb.tag}
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
                onClick={handleAddFeedback}
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
});
export default HighlightableViewer;
