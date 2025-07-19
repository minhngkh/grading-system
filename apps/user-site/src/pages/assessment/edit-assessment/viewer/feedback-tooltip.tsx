import { Badge } from "@/components/ui/badge";
import { getTagColor } from "@/pages/assessment/edit-assessment/icon-utils";
import { FeedbackItem } from "@/types/assessment";
import Tippy from "@tippyjs/react";
import { useState } from "react";

interface FeedbackTooltipProps {
  fb: FeedbackItem;
  startEl: HTMLElement | null;
  endEl: HTMLElement | null;
}

export default function FeedbackTooltip({ fb, startEl, endEl }: FeedbackTooltipProps) {
  const [visible, setVisible] = useState(true);
  const getVirtualRect = (elements: (HTMLElement | null)[]): DOMRect => {
    const rects = elements
      .filter((el): el is HTMLElement => el !== null)
      .map((el) => el.getBoundingClientRect());

    const top = Math.min(...rects.map((r) => r.top));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));

    const width = right - left;
    const height = bottom - top;

    return {
      top,
      bottom,
      left,
      right,
      width,
      height,
      x: left,
      y: top,
      toJSON: () => ({}),
    } as DOMRect;
  };

  return (
    <Tippy
      getReferenceClientRect={() => getVirtualRect([startEl, endEl])}
      content={
        <div className="flex flex-col gap-2 p-3 bg-white shadow-md break-words">
          <h1 className="font-bold text-lg text-black">{fb.criterion}</h1>
          <Badge variant="outline" className={`text-black ${getTagColor(fb.tag)}`}>
            {fb.tag}
          </Badge>
          <p className="white-pre custom-tooltip text-sm text-black wrap-break-word">
            {fb.comment}
          </p>
        </div>
      }
      interactive
      animation="scale"
      visible={visible}
      onClickOutside={() => {
        setVisible(false);
      }}
      popperOptions={{
        modifiers: [{ name: "flip", options: { fallbackPlacements: ["bottom-start"] } }],
      }}
      placement="top-start"
      appendTo={() => document.getElementById("shiki-container")!}
      maxWidth={700}
      zIndex={1}
    />
  );
}
