import React, { useState } from "react";

interface ImageViewerProps {
  src: string; // đảm bảo luôn là string
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="flex justify-center items-center w-full cursor-zoom-in"
        onClick={() => setOpen(true)}
      >
        <img src={src} />
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setOpen(false)}
        >
          <img
            src={src}
            style={{
              maxWidth: "96vw",
              maxHeight: "96vh",
              objectFit: "contain",
              borderRadius: 12,
              background: "#222",
              boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
            }}
          />
        </div>
      )}
    </>
  );
};

export default ImageViewer;
