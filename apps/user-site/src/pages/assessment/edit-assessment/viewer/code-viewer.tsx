import { useState, useEffect } from "react";
import ShikiHighlighter from "react-shiki";
import { Assessment, FeedbackItem } from "@/types/assessment";
import { useTheme } from "@/context/theme-provider";
import "./viewer.css";
import { FileItem } from "@/types/file";
import FeedbackTooltip from "@/components/app/feedback-tooltip";

interface HighlightableViewerProps {
  file: FileItem;
  activeFeedbackId?: number | null;
  onSelectionMade?: () => void;
  onSelectionChange?: (selection: any) => void;
  assessment: Assessment;
  onUpdate?: (updatedAssessment: Partial<Assessment>) => void;
  onUpdateLastSave?: (updatedLastSaved: Partial<Assessment>) => void;
}

const HighlightableViewer = ({
  file,
  activeFeedbackId,
  onSelectionMade,
  onSelectionChange,
  assessment,
  onUpdate,
  onUpdateLastSave,
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
    const onMouseMove = () => {};
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
    file: FileItem,
    feedbacks: FeedbackItem[],
  ): FeedbackItem[] {
    const rawLines = file.content.split(/\r?\n/);
    const lines = rawLines.map((l) => l.trimEnd());
    const totalLines = lines.length;

    return feedbacks.map((fb) => {
      if (
        fb.locationData?.type !== "text" ||
        fb.fileRef.substring(fb.fileRef.indexOf("/") + 1) !== file.relativePath ||
        fb.tag === "discarded"
      )
        return fb;

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

  function mergeIntersectingFeedbacks(feedbacks: FeedbackItem[]): FeedbackItem[] {
    const fileName = file.relativePath;

    const textFeedbacksWithIndices: Array<{ fb: FeedbackItem; originalIndex: number }> =
      [];
    feedbacks.forEach((fb, index) => {
      if (
        fb.locationData?.type === "text" &&
        fb.fileRef &&
        fb.fileRef.substring(fb.fileRef.indexOf("/") + 1) === fileName
      ) {
        textFeedbacksWithIndices.push({ fb, originalIndex: index });
      }
    });

    if (textFeedbacksWithIndices.length <= 1) return feedbacks;

    const hasIntersection = (fb1: FeedbackItem, fb2: FeedbackItem): boolean => {
      if (fb1.locationData?.type !== "text" || fb2.locationData?.type !== "text")
        return false;

      const {
        fromLine: f1Line,
        toLine: t1Line,
        fromCol: f1Col = 0,
        toCol: t1Col = 0,
      } = fb1.locationData;
      const {
        fromLine: f2Line,
        toLine: t2Line,
        fromCol: f2Col = 0,
        toCol: t2Col = 0,
      } = fb2.locationData;

      if (f1Line === f2Line && t1Line === t2Line) {
        const similarity = calculateSimilarity(fb1.comment, fb2.comment);
        if (similarity > 0.8) {
          return false;
        }
      }

      const checkIntersection = (
        fromLine1: number,
        toLine1: number,
        fromCol1: number,
        toCol1: number,
        fromLine2: number,
        toLine2: number,
        fromCol2: number,
        toCol2: number,
      ): boolean => {
        const start1IsBeforeEnd2 =
          fromLine1 < toLine2 || (fromLine1 === toLine2 && fromCol1 < toCol2);
        const start2IsBeforeEnd1 =
          fromLine2 < toLine1 || (fromLine2 === toLine1 && fromCol2 < toCol1);

        if (!(start1IsBeforeEnd2 && start2IsBeforeEnd1)) {
          return false;
        }

        const start1LEstart2 =
          fromLine1 < fromLine2 || (fromLine1 === fromLine2 && fromCol1 <= fromCol2);
        const end2LEend1 = toLine2 < toLine1 || (toLine2 === toLine1 && toCol2 <= toCol1);
        const range1ContainsRange2 = start1LEstart2 && end2LEend1;

        const start2LEstart1 =
          fromLine2 < fromLine1 || (fromLine2 === fromLine1 && fromCol2 <= fromCol1);
        const end1LEend2 = toLine1 < toLine2 || (toLine1 === toLine2 && toCol1 <= toCol2);
        const range2ContainsRange1 = start2LEstart1 && end1LEend2;

        return !(range1ContainsRange2 || range2ContainsRange1);
      };

      const fb1IntersectsFb2 = checkIntersection(
        f1Line,
        t1Line,
        f1Col,
        t1Col,
        f2Line,
        t2Line,
        f2Col,
        t2Col,
      );
      const fb2IntersectsFb1 = checkIntersection(
        f2Line,
        t2Line,
        f2Col,
        t2Col,
        f1Line,
        t1Line,
        f1Col,
        t1Col,
      );

      const result = fb1IntersectsFb2 || fb2IntersectsFb1;

      return result;
    };

    const calculateSimilarity = (text1: string, text2: string): number => {
      const longer = text1.length > text2.length ? text1 : text2;
      const shorter = text1.length > text2.length ? text2 : text1;

      if (longer.length === 0) return 1.0;

      const editDistance = levenshteinDistance(longer, shorter);
      return (longer.length - editDistance) / longer.length;
    };

    const levenshteinDistance = (str1: string, str2: string): number => {
      const matrix = [];

      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }

      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1,
            );
          }
        }
      }

      return matrix[str2.length][str1.length];
    };

    const mergeFeedbacks = (fb1: FeedbackItem, fb2: FeedbackItem): FeedbackItem => {
      if (fb1.locationData?.type !== "text" || fb2.locationData?.type !== "text")
        return fb1;

      const {
        fromLine: f1Line,
        toLine: t1Line,
        fromCol: f1Col = 0,
        toCol: t1Col = 0,
      } = fb1.locationData;
      const {
        fromLine: f2Line,
        toLine: t2Line,
        fromCol: f2Col = 0,
        toCol: t2Col = 0,
      } = fb2.locationData;

      const mergedFromLine = Math.min(f1Line, f2Line);
      const mergedToLine = Math.max(t1Line, t2Line);

      let mergedFromCol = 0;
      let mergedToCol = 0;

      if (mergedFromLine === f1Line && mergedFromLine === f2Line) {
        mergedFromCol = Math.min(f1Col, f2Col);
      } else if (mergedFromLine === f1Line) {
        mergedFromCol = f1Col;
      } else {
        mergedFromCol = f2Col;
      }

      if (mergedToLine === t1Line && mergedToLine === t2Line) {
        mergedToCol = Math.max(t1Col, t2Col);
      } else if (mergedToLine === t1Line) {
        mergedToCol = t1Col;
      } else {
        mergedToCol = t2Col;
      }

      let mergedComment = fb1.comment;
      if (fb2.comment && !fb1.comment.includes(fb2.comment)) {
        mergedComment = fb1.comment + "\n" + fb2.comment;
      }

      return {
        ...fb1,
        tag: "info",
        comment: mergedComment,
        locationData: {
          type: "text",
          fromLine: mergedFromLine,
          toLine: mergedToLine,
          fromCol: mergedFromCol,
          toCol: mergedToCol,
        },
      };
    };

    const groups: Array<{ fb: FeedbackItem; originalIndex: number }[]> = [];
    const processed = new Set<number>();

    textFeedbacksWithIndices.forEach(({ fb, originalIndex }, index) => {
      if (processed.has(index)) return;

      const group = [{ fb, originalIndex }];
      processed.add(index);

      let foundIntersection = true;
      while (foundIntersection) {
        foundIntersection = false;

        textFeedbacksWithIndices.forEach((candidateItem, candidateIndex) => {
          if (processed.has(candidateIndex)) return;

          const intersectsWithGroup = group.some((groupItem) =>
            hasIntersection(groupItem.fb, candidateItem.fb),
          );

          if (intersectsWithGroup) {
            group.push(candidateItem);
            processed.add(candidateIndex);
            foundIntersection = true;
          }
        });
      }

      groups.push(group);
    });

    let result = [...feedbacks];

    const indicesToRemove = new Set<number>();

    groups.forEach((group) => {
      if (group.length === 1) return;

      const mergedFeedback = group.reduce(
        (merged, { fb }) => mergeFeedbacks(merged, fb),
        group[0].fb,
      );

      const indices = group.map(({ originalIndex }) => originalIndex);
      const firstIndex = Math.min(...indices);
      result[firstIndex] = mergedFeedback;
      indices.forEach((idx) => {
        if (idx !== firstIndex) indicesToRemove.add(idx);
      });
    });

    const sortedIndicesToRemove = Array.from(indicesToRemove).sort((a, b) => b - a);
    sortedIndicesToRemove.forEach((index) => {
      result.splice(index, 1);
    });

    return result;
  }

  const [didInitSave, setDidInitSave] = useState(false);

  useEffect(() => {
    if (!didInitSave) {
      const adjusted = getAdjustedFeedbacks(file, assessment.feedbacks);
      const merged = mergeIntersectingFeedbacks(adjusted);

      const initStr = JSON.stringify(
        assessment.feedbacks.map((fb) => ({
          locationData: fb.locationData,
          comment: fb.comment,
          tag: fb.tag,
          fileRef: fb.fileRef,
        })),
      );
      const mergedStr = JSON.stringify(
        merged.map((fb) => ({
          locationData: fb.locationData,
          comment: fb.comment,
          tag: fb.tag,
          fileRef: fb.fileRef,
        })),
      );

      if (mergedStr !== initStr) {
        onUpdate?.({ feedbacks: merged });
        onUpdateLastSave?.({ feedbacks: merged });
      }
      setDidInitSave(true);
    }
  }, []);

  useEffect(() => {
    if (didInitSave) {
      const adjusted = getAdjustedFeedbacks(file, assessment.feedbacks);
      const merged = mergeIntersectingFeedbacks(adjusted);

      const initStr = JSON.stringify(
        assessment.feedbacks.map((fb) => ({
          locationData: fb.locationData,
          comment: fb.comment,
          tag: fb.tag,
          fileRef: fb.fileRef,
        })),
      );
      const mergedStr = JSON.stringify(
        merged.map((fb) => ({
          locationData: fb.locationData,
          comment: fb.comment,
          tag: fb.tag,
          fileRef: fb.fileRef,
        })),
      );

      if (mergedStr !== initStr) {
        onUpdate?.({ feedbacks: merged });
      }
    }
  }, [assessment.feedbacks, onUpdate, didInitSave]);

  useEffect(() => {
    if (activeFeedbackId === null || activeFeedbackId === undefined) {
      setTooltipFb(null);
      setStartLineElement(null);
      setEndLineElement(null);
      return;
    }

    const fb = assessment.feedbacks[activeFeedbackId];
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

              setStartLineElement(null);
              setEndLineElement(null);
              setTooltipFb(null);

              setTimeout(() => {
                setStartLineElement(startEl as HTMLElement);
                setEndLineElement(endEl as HTMLElement);
                setTooltipFb(fb);
              }, 100);
            }
          }
        }
      };

      setTimeout(tryScroll, 50);
    }
  }, [activeFeedbackId, assessment.feedbacks, file.type]);

  const renderContent = () => {
    const fileName = file.relativePath;

    const validFeedbacks = assessment.feedbacks
      .map((fb, idx) => ({ fb, idx }))
      .filter(
        ({ fb }) =>
          fb.fileRef.substring(fb.fileRef.indexOf("/") + 1) === fileName &&
          fb.tag !== "discarded",
      );

    if (file.type === "code") {
      const getShikiTheme = () => (theme === "dark" ? "github-dark" : "github-light");

      return (
        <ShikiHighlighter
          language={language}
          className="overflow-auto custom-scrollbar m-1"
          theme={getShikiTheme()}
          addDefaultStyles
          showLanguage={false}
          transformers={[
            {
              preprocess(_, options) {
                let decorations = validFeedbacks
                  .filter(
                    ({ fb }) =>
                      fb.locationData.type === "text" &&
                      typeof fb.locationData.fromLine === "number" &&
                      typeof fb.locationData.toLine === "number",
                  )
                  .map(({ fb, idx }) => {
                    if (fb.locationData.type !== "text") {
                      return null;
                    }
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
                      feedbackIndex: idx,
                    };
                  })
                  .filter(Boolean);

                if (typeof activeFeedbackId === "number") {
                  decorations = decorations.filter(
                    (decoration) =>
                      decoration && decoration.feedbackIndex === activeFeedbackId,
                  );
                }

                options.decorations = decorations.filter(Boolean).map((decoration) => ({
                  start: {
                    line: decoration!.fb.locationData.fromLine - 1,
                    character:
                      typeof decoration!.fb.locationData.fromCol === "number" ?
                        decoration!.fb.locationData.fromCol
                      : 0,
                  },
                  end: {
                    line: decoration!.fb.locationData.toLine - 1,
                    character:
                      typeof decoration!.fb.locationData.toCol === "number" ?
                        decoration!.fb.locationData.toCol
                      : 0,
                  },
                  properties: {
                    class:
                      "annotation-span" +
                      ((
                        typeof activeFeedbackId === "number" &&
                        decoration!.feedbackIndex === activeFeedbackId
                      ) ?
                        " annotation-span-focused"
                      : ""),
                    "data-id": decoration!.feedbackIndex,
                    "data-tag": decoration!.fb.tag,
                  },
                  alwaysWrap: true,
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
                  style: "background: var(--background); margin: 0; padding: 0.5rem;",
                  class: "custom-scrollbar ",
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
