import React from "react";
import { Worker } from "@react-pdf-viewer/core";
import { Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { highlightPlugin, Trigger } from "@react-pdf-viewer/highlight";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";

const PDFViewer = ({ fileUrl }: { fileUrl: string }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const highlightPluginInstance = highlightPlugin({
    trigger: Trigger.TextSelection,
  });

  // Nếu không có fileUrl thì không render Viewer
  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No PDF file selected.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "600px" }}>
      <div style={{ flex: 1, border: "1px solid rgba(0, 0, 0, 0.3)", padding: "10px" }}>
        <Worker
          workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}
        >
          <Viewer
            fileUrl={fileUrl}
            plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
          />
        </Worker>
      </div>
    </div>
  );
};

export default PDFViewer;
