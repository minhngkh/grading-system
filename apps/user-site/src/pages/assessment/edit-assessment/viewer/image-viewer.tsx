import { useState, useEffect, useRef } from "react";

interface ImageViewerProps {
  src: string;
  onSelectionMade?: () => void;
  onSelectionChange?: (selection: any) => void;
}

const ImageViewer = ({ src, onSelectionMade, onSelectionChange }: ImageViewerProps) => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageClick = () => {
    if (onSelectionChange) {
      const imageLocationData = {
        type: "image" as const,
      };
      onSelectionChange(imageLocationData);
    }

    if (onSelectionMade) {
      onSelectionMade();
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => Math.max(5, Math.min(3, prev + delta))); // min scale = 0.5
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto custom-scrollbar bg-background"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: scale <= 1 ? "center" : "flex-start",
            justifyContent: scale <= 1 ? "center" : "flex-start",
          }}
        >
          <img
            className="block cursor-pointer"
            src={src}
            onClick={handleImageClick}
            draggable={false}
            style={{
              width: `calc(100% * ${scale})`,
              height: `calc(100% * ${scale})`,
              objectFit: "contain",
              transition: "width 0.1s ease-out, height 0.1s ease-out",
              display: "block",
              margin: scale <= 1 ? "auto" : "0",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
