// import type React from "react";
// import { useState, useRef, useCallback, useEffect } from "react";
// import { Save } from "lucide-react";
// import { FeedbackItem } from "@/types/assessment";
// import "./viewer.css";
// type ImageHighlighterProps = {
//   imageUrl: string;
//   feedbacks: FeedbackItem[];
//   updateFeedback: (newFeedbacks: FeedbackItem[]) => void;
//   isHighlightMode: boolean;
//   onHighlightComplete: () => void;
//   activeFeedbackId?: string | null;
//   fileRef?: string;
//   rubricCriteria?: string[]; // Add this prop for criteria options
// };

// const HIGHLIGHT_TAGS = ["info", "notice", "tip", "caution"] as const;

// export function ImageHighlighter({
//   imageUrl,
//   feedbacks,
//   updateFeedback,
//   isHighlightMode,
//   onHighlightComplete,
//   activeFeedbackId,
//   fileRef,
//   rubricCriteria = [],
// }: ImageHighlighterProps) {
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
//   const [currentRect, setCurrentRect] = useState<{
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//   } | null>(null);
//   const [showCommentForm, setShowCommentForm] = useState(false);
//   const [newComment, setNewComment] = useState("");
//   const [newTag, setNewTag] = useState<(typeof HIGHLIGHT_TAGS)[number]>("info");
//   const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null);
//   const [hoveredHighlight, setHoveredHighlight] = useState<string | null>(null);
//   const [newCriterion, setNewCriterion] = useState<string>("");
//   const containerRef = useRef<HTMLDivElement>(null);
//   const imageRef = useRef<HTMLImageElement>(null);

//   // Get relative coordinates within the image
//   const getRelativeCoordinates = useCallback((clientX: number, clientY: number) => {
//     if (!imageRef.current) return { x: 0, y: 0 };
//     const imageRect = imageRef.current.getBoundingClientRect();
//     // Đảm bảo ảnh không bị co kéo bởi CSS ngoài (object-fit, max-width, v.v.)
//     // Tính toạ độ phần trăm dựa trên bounding box thực tế của ảnh
//     const x = ((clientX - imageRect.left) / imageRect.width) * 100;
//     const y = ((clientY - imageRect.top) / imageRect.height) * 100;
//     return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
//   }, []);

//   // Handle mouse down - start drawing
//   const handleMouseDown = useCallback(
//     (e: React.MouseEvent) => {
//       if (!isHighlightMode) return;
//       e.preventDefault();
//       const coords = getRelativeCoordinates(e.clientX, e.clientY);
//       setStartPoint(coords);
//       setIsDrawing(true);
//       setSelectedHighlight(null);
//     },
//     [isHighlightMode, getRelativeCoordinates],
//   );

//   // Handle mouse move - update current rectangle
//   const handleMouseMove = useCallback(
//     (e: React.MouseEvent) => {
//       if (!isDrawing || !startPoint) return;
//       const coords = getRelativeCoordinates(e.clientX, e.clientY);

//       // Tính toán lại rect để luôn nằm trong [0, 100]%
//       let x1 = Math.max(0, Math.min(100, startPoint.x));
//       let y1 = Math.max(0, Math.min(100, startPoint.y));
//       let x2 = Math.max(0, Math.min(100, coords.x));
//       let y2 = Math.max(0, Math.min(100, coords.y));
//       const x = Math.min(x1, x2);
//       const y = Math.min(y1, y2);
//       const width = Math.max(0, Math.abs(x2 - x1));
//       const height = Math.max(0, Math.abs(y2 - y1));

//       setCurrentRect({ x, y, width, height });
//     },
//     [isDrawing, startPoint, getRelativeCoordinates],
//   );

//   // State để giữ vùng chọn khi mở modal
//   const [modalRect, setModalRect] = useState<{
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//   } | null>(null);

//   // Handle mouse up - finish drawing
//   const handleMouseUp = useCallback(() => {
//     if (!isDrawing || !currentRect || !startPoint) return;
//     if (currentRect.width > 1 && currentRect.height > 1) {
//       setModalRect({ ...currentRect }); // Lưu vùng chọn cho modal
//       setCurrentRect(null); // Ẩn vùng chọn khi hiện modal
//       setShowCommentForm(true);
//     }
//     setIsDrawing(false);
//   }, [isDrawing, currentRect, startPoint]);

//   // Add new feedback highlight
//   const handleAddHighlight = () => {
//     if (!modalRect) return;
//     if (!newComment.trim() || !newCriterion) return;
//     const fileName = fileRef || (imageUrl ? imageUrl.split("/").pop() || "" : "");
//     const newFeedback: FeedbackItem = {
//       id: `highlight-${Date.now()}`,
//       type: "image",
//       criterion: newCriterion,
//       fileRef: fileName,
//       x: modalRect.x,
//       y: modalRect.y,
//       width: modalRect.width,
//       height: modalRect.height,
//       comment: newComment.trim(),
//       tag: newTag,
//     };
//     updateFeedback([newFeedback]);
//     setCurrentRect(null);
//     setStartPoint(null);
//     setModalRect(null);
//     setNewComment("");
//     setShowCommentForm(false);
//     setNewTag("info");
//     setNewCriterion("");
//     onHighlightComplete();
//   };

//   // Cancel drawing
//   const handleCancelDrawing = () => {
//     setCurrentRect(null);
//     setStartPoint(null);
//     setIsDrawing(false);
//     setShowCommentForm(false);
//     setNewComment("");
//     setNewTag("info");
//   };

//   // --- Highlight hover effect (like highlightable-viewer) ---
//   useEffect(() => {
//     const onMouseEnter = (e: MouseEvent) => {
//       const target = (e.target as HTMLElement).closest(".annotation-span") as HTMLElement;
//       if (target) {
//         const id = target.getAttribute("data-id");
//         document
//           .querySelectorAll(`.annotation-span[data-id="${id}"]`)
//           .forEach((el) => el.classList.add("hovered"));
//       }
//     };
//     const onMouseLeave = (e: MouseEvent) => {
//       const target = (e.target as HTMLElement).closest(".annotation-span") as HTMLElement;
//       if (target) {
//         const id = target.getAttribute("data-id");
//         document
//           .querySelectorAll(`.annotation-span[data-id="${id}"]`)
//           .forEach((el) => el.classList.remove("hovered"));
//       }
//     };
//     document.addEventListener("mouseover", onMouseEnter);
//     document.addEventListener("mouseout", onMouseLeave);
//     return () => {
//       document.removeEventListener("mouseover", onMouseEnter);
//       document.removeEventListener("mouseout", onMouseLeave);
//     };
//   }, []);

//   // --- Only allow drawing in highlight mode ---
//   const mouseHandlers =
//     isHighlightMode ?
//       {
//         onMouseDown: handleMouseDown,
//         onMouseMove: handleMouseMove,
//         onMouseUp: handleMouseUp,
//       }
//     : {};

//   // --- Only show highlights for this file/image ---
//   const fileName = fileRef || (imageUrl ? imageUrl.split("/").pop() || "" : "");
//   let visibleFeedbacks = feedbacks.filter(
//     (fb): fb is Extract<FeedbackItem, { type: "image" }> =>
//       fb.type === "image" &&
//       fb.fileRef === fileName &&
//       typeof fb.x === "number" &&
//       typeof fb.y === "number" &&
//       typeof fb.width === "number" &&
//       typeof fb.height === "number",
//   );
//   // Nếu có activeFeedbackId và không ở highlight mode, chỉ render feedback đó
//   if (activeFeedbackId && !isHighlightMode) {
//     visibleFeedbacks = visibleFeedbacks.filter(
//       (fb) => (fb.id || fb.comment) === activeFeedbackId,
//     );
//   }

//   // Comment Form Modal (đồng nhất với highlightable-viewer)
//   return (
//     <div className="w-full h-full mx-auto">
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full flex justify-center">
//         <div
//           ref={containerRef}
//           className="relative select-none"
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             width: "100%",
//             height: "100%",
//           }}
//         >
//           <div
//             style={{
//               position: "relative",
//               display: "inline-block",
//               // Luôn chiếm tối đa không gian cho ảnh, không phụ thuộc vào naturalWidth/Height
//               width: "auto",
//               height: "auto",
//               maxWidth: "95vw",
//               maxHeight: "85vh",
//             }}
//           >
//             <img
//               ref={imageRef}
//               src={imageUrl || "/placeholder.svg"}
//               alt="Highlightable content"
//               className="block object-contain"
//               draggable={false}
//               style={{
//                 width: "100%",
//                 height: "100%",
//                 maxWidth: "95vw",
//                 maxHeight: "85vh",
//                 margin: "0 auto",
//                 position: "relative",
//                 zIndex: 1,
//                 boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)",
//                 borderRadius: "8px",
//                 background: "#fff",
//                 display: "block",
//                 objectFit: "contain",
//               }}
//               onLoad={() => {
//                 setCurrentRect((rect) => (rect ? { ...rect } : null));
//               }}
//               onMouseDown={isHighlightMode ? handleMouseDown : undefined}
//               onMouseMove={isHighlightMode ? handleMouseMove : undefined}
//               onMouseUp={isHighlightMode ? handleMouseUp : undefined}
//             />

//             {/* Existing highlights */}
//             {visibleFeedbacks.map((highlight) => (
//               <span
//                 key={highlight.id || highlight.comment}
//                 className={
//                   `annotation-span` +
//                   (activeFeedbackId === (highlight.id || highlight.comment) ?
//                     " annotation-span-focused"
//                   : "")
//                 }
//                 data-id={highlight.id || highlight.comment}
//                 data-comment={highlight.comment}
//                 data-tag={highlight.tag}
//                 style={{
//                   position: "absolute",
//                   left: `calc(${highlight.x}% )`,
//                   top: `calc(${highlight.y}% )`,
//                   width: `calc(${highlight.width}% )`,
//                   height: `calc(${highlight.height}% )`,
//                   zIndex: 2,
//                   display: "block",
//                   pointerEvents: "auto",
//                 }}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   setSelectedHighlight(
//                     selectedHighlight === (highlight.id || highlight.comment) ?
//                       null
//                     : highlight.id || highlight.comment,
//                   );
//                 }}
//                 onMouseEnter={() =>
//                   setHoveredHighlight(highlight.id || highlight.comment)
//                 }
//                 onMouseLeave={() => setHoveredHighlight(null)}
//               >
//                 {/* Tooltip */}
//                 {hoveredHighlight === (highlight.id || highlight.comment) && (
//                   <div className="absolute top-full left-0 mt-2 p-2 bg-black text-white text-xs rounded shadow-lg max-w-xs z-10">
//                     {highlight.comment}
//                   </div>
//                 )}
//               </span>
//             ))}

//             {/* Current drawing rectangle */}
//             {currentRect && (
//               <div
//                 className="absolute border-2 border-dashed border-gray-800 bg-gray-500 bg-opacity-30"
//                 style={{
//                   left: `${currentRect.x}%`,
//                   top: `${currentRect.y}%`,
//                   width: `${currentRect.width}%`,
//                   height: `${currentRect.height}%`,
//                   zIndex: 1000,
//                 }}
//               />
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Dialog Add Feedback: giống highlightable-viewer */}
//       {showCommentForm && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96 z-50">
//             <h2 className="text-lg font-bold mb-4">Add Feedback</h2>
//             <textarea
//               className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
//               rows={4}
//               value={newComment}
//               onChange={(e) => setNewComment(e.target.value)}
//               placeholder="Enter your feedback..."
//             />
//             <div className="mt-4">
//               <label className="block text-sm font-medium mb-2">Select Tag:</label>
//               <select
//                 className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
//                 value={newTag}
//                 onChange={(e) =>
//                   setNewTag(e.target.value as (typeof HIGHLIGHT_TAGS)[number])
//                 }
//               >
//                 <option value="info">Info</option>
//                 <option value="notice">Notice</option>
//                 <option value="tip">Tip</option>
//                 <option value="caution">Caution</option>
//               </select>
//             </div>
//             <div className="mt-4">
//               <label className="block text-sm font-medium mb-2">Select Criterion:</label>
//               <select
//                 className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
//                 value={newCriterion}
//                 onChange={(e) => setNewCriterion(e.target.value)}
//               >
//                 <option value="">Select criterion</option>
//                 {rubricCriteria.map((c) => (
//                   <option key={c} value={c}>
//                     {c}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="flex justify-end mt-4 gap-2">
//               <button
//                 onClick={handleCancelDrawing}
//                 className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
//                 type="button"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAddHighlight}
//                 disabled={!newComment.trim() || !newCriterion}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
//                 type="button"
//               >
//                 <Save className="h-4 w-4" />
//                 <span>Add</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
