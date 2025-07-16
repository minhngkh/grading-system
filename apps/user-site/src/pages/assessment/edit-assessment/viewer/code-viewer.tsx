import React, { useState, useEffect } from "react";
import ShikiHighlighter from "react-shiki";
import { FeedbackItem } from "@/types/assessment";
import { useTheme } from "@/context/theme-provider";
import "./viewer.css";
import { FileItem } from "@/types/file";

interface HighlightableViewerProps {
  file: FileItem;
  feedbacks: FeedbackItem[];
  updateFeedback: (feedbackId: string, updatedFeedback: FeedbackItem) => void;
  activeFeedbackId?: string | null;
  onSelectionMade?: () => void;
  onSelectionChange?: (selection: any) => void;
}

const HighlightableViewer = ({
  file,
  feedbacks,
  updateFeedback,
  activeFeedbackId,
  onSelectionMade,
  onSelectionChange,
}: HighlightableViewerProps) => {
  const { theme } = useTheme();
  const [selectionRange, setSelectionRange] = useState<{
    from: { line: number; col: number };
    to: { line: number; col: number };
  } | null>(null);

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

    for (let i = 0; i < adjusted.length; i++) {
      if (JSON.stringify(adjusted[i]) !== JSON.stringify(feedbacks[i])) {
        const originalFeedback = feedbacks[i];
        if (originalFeedback.id) {
          updateFeedback(originalFeedback.id, adjusted[i]);
        }
      }
    }
  }, [file.content, feedbacks, updateFeedback]);

  useEffect(() => {
    if (!activeFeedbackId) return;

    const fb = feedbacks.find((f) => f.id === activeFeedbackId);
    if (
      fb &&
      fb.locationData?.type === "text" &&
      typeof fb.locationData.fromLine === "number"
    ) {
      let tries = 0;
      const tryScroll = () => {
        if (file.type === "code") {
          const root = document.getElementById(`shiki-container`);
          if (!root) return;

          let lineEl: Element | null = null;
          if (
            fb.locationData?.type === "text" &&
            typeof fb.locationData.fromLine === "number"
          ) {
            lineEl = root.querySelector(`.line[data-line="${fb.locationData.fromLine}"]`);
          }
          if (lineEl) {
            const lineTop = (lineEl as HTMLElement).offsetTop;
            const containerTop = root.offsetTop;
            root.scrollTo({
              top: lineTop - containerTop - 50,
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
  }, [activeFeedbackId, feedbacks, file.relativePath, file.type]);

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
                    "data-comment": fb.comment,
                    "data-tag": fb.tag,
                    "data-criterion": fb.criterion,
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

    function getFeedbackGroupsForLine(lineIdx: number, lineLength: number) {
      const boundaries: {
        pos: number;
        type: "start" | "end";
        fb: FeedbackItem;
        feedbackId: string;
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

          const feedbackId = fb.id ?? "";
          const fromCol =
            typeof fb.locationData.fromCol === "number" ? fb.locationData.fromCol : 0;
          const toCol =
            typeof fb.locationData.toCol === "number" ? fb.locationData.toCol : 0;
          const fromLine = fb.locationData.fromLine;

          if (lineIdx + 1 !== fromLine) return;

          const start = fromCol;
          const end = toCol;
          if (start < end) {
            boundaries.push({ pos: start, type: "start", fb, feedbackId });
            boundaries.push({ pos: end, type: "end", fb, feedbackId });
          }
        });

      boundaries.sort((a, b) => a.pos - b.pos || (a.type === "end" ? -1 : 1));

      const segments: {
        start: number;
        end: number;
        feedbacks: { fb: FeedbackItem; feedbackId: string }[];
      }[] = [];
      let active: { fb: FeedbackItem; feedbackId: string }[] = [];
      let lastPos = 0;

      for (const b of boundaries) {
        if (b.pos > lastPos) {
          segments.push({ start: lastPos, end: b.pos, feedbacks: [...active] });
        }
        if (b.type === "start") {
          active.push({ fb: b.fb, feedbackId: b.feedbackId });
        } else {
          active = active.filter((f) => f.fb !== b.fb);
        }
        lastPos = b.pos;
      }

      if (lastPos < lineLength) {
        segments.push({ start: lastPos, end: lineLength, feedbacks: [...active] });
      }

      return segments;
    }

    return (
      <div
        className="font-serif text-md leading-relaxed whitespace-pre-wrap p-3 overflow-auto"
        id="essay-container"
      >
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

                if (activeFeedbackId !== undefined && activeFeedbackId !== null) {
                  const activeFb = seg.feedbacks.find(
                    (f) => String(f.feedbackId) === String(activeFeedbackId),
                  );
                  if (activeFb) {
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
                        key={`${fb.fileRef}-${fromLine}-${toLine}-${fb.criterion}-${fb.comment}-${idx}-active`}
                        className={
                          "annotation-span actived annotation-span-focused " +
                          (seg.feedbacks.length === 1 ? "highlight-top" : "")
                        }
                        data-id={String(activeFb.feedbackId)}
                        data-comment={fb.comment}
                        data-tag={fb.tag}
                      >
                        {inner}
                      </span>
                    );
                  }
                } else {
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
                        key={`${fb.fileRef}-${fromLine}-${toLine}-${fb.criterion}-${fb.comment}-${idx}-${fbIdx}`}
                        className={
                          "annotation-span " +
                          (fbIdx === seg.feedbacks.length - 1 ?
                            "highlight-top"
                          : "highlight-under")
                        }
                        data-id={String(f.feedbackId)}
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

  return <>{renderContent()}</>;
};

export default HighlightableViewer;
