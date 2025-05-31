import React, { useState } from "react";
import { Worker } from "@react-pdf-viewer/core";
import { Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { highlightPlugin, Trigger } from "@react-pdf-viewer/highlight";
import pdf from "./abcde.pdf"; // Adjust the path to your PDF file
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";

const PDFViewer = () => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // Using Trigger.TextSelection to allow text selection to trigger highlighting
  const highlightPluginInstance = highlightPlugin({
    trigger: Trigger.TextSelection,
  });

  const [highlightedWord, setHighlightedWord] = useState("");

  // Function to return the highlight areas dynamically
  const renderHighlights = () => {
    console.log("renderHighlights called with:", highlightedWord); // Debug log
    if (!highlightedWord) return [];

    const highlightColor = "rgba(255, 255, 0, 0.5)"; // Yellow color for highlight

    // Define the highlight areas based on the highlighted word
    if (highlightedWord === "Dummy") {
      return [
        {
          pageIndex: 0, // Change to the correct page index
          rects: [
            { x: 50, y: 100, width: 100, height: 20, color: highlightColor }, // Adjust coordinates
          ],
        },
      ];
    } else if (highlightedWord === "PDF") {
      return [
        {
          pageIndex: 0,
          rects: [
            { x: 50, y: 130, width: 100, height: 20, color: highlightColor }, // Adjust coordinates
          ],
        },
      ];
    } else if (highlightedWord === "File") {
      return [
        {
          pageIndex: 0,
          rects: [
            { x: 50, y: 160, width: 100, height: 20, color: highlightColor }, // Adjust coordinates
          ],
        },
      ];
    }
    return [];
  };

  return (
    <div style={{ display: "flex", height: "600px" }}>
      {/* Left container for PDF */}
      <div style={{ flex: 1, border: "1px solid rgba(0, 0, 0, 0.3)", padding: "10px" }}>
        <Worker
          workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}
        >
          <Viewer
            fileUrl={pdf}
            plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
          />
        </Worker>
      </div>
    </div>
  );
};

export default PDFViewer;
