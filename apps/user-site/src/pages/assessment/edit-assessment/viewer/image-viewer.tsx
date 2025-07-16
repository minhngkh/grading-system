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
        setScale((prev) => Math.max(0.2, Math.min(3, prev + delta)));
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex justify-center items-center w-full h-full overflow-auto bg-gray-50"
    >
      <div
        className="relative"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          transition: "transform 0.1s ease-out",
        }}
      >
        <img
          className="block max-w-none cursor-pointer hover:cursor-pointer"
          src={src}
          onClick={handleImageClick}
          draggable={false}
          style={{
            width: "auto",
            height: "auto",
            minWidth: "300px",
            minHeight: "200px",
          }}
        />
      </div>
    </div>
  );
};

export default ImageViewer;
