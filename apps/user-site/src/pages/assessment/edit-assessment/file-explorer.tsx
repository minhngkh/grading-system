import React from "react";
import { FolderOpen, Folder, Badge } from "lucide-react";
import { getFileIcon } from "./icon-utils";
import { GradingAttempt } from "@/types/grading";

// Build a recursive tree from files
function buildFileTree(files: any[]) {
  const root: any = {};
  if (!Array.isArray(files)) return root; // phòng thủ nếu files undefined/null
  files.forEach((file) => {
    if (!file || typeof file.relativePath !== "string") return;
    const parts = file.relativePath.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        if (!node.files) node.files = [];
        node.files.push(file);
      } else {
        if (!node.folders) node.folders = {};
        if (!node.folders[part]) node.folders[part] = {};
        node = node.folders[part];
      }
    }
  });
  return root;
}

// Helper for feedback badge (backward compatible)
function countFeedbackForFile(feedbacks: any[], file: any) {
  return feedbacks.filter(
    (f) =>
      f.fileRef === file.relativePath ||
      f.fileRef === file.blobPath ||
      f.fileRef === file.name ||
      f.fileRef === file.path,
  ).length;
}
function hasFeedbackForFile(feedbacks: any[], file: any) {
  return countFeedbackForFile(feedbacks, file) > 0;
}

interface FileExplorerProps {
  files: any[]; // <-- truyền mảng file có relativePath
  selectedFile: any;
  setSelectedFile: (file: any) => void;
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  feedbacks: any[];
  grading: GradingAttempt;
}

// Recursive render
function renderTree(
  node: any,
  parentPath: string,
  expandedFolders: Record<string, boolean>,
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  selectedFile: any,
  setSelectedFile: (file: any) => void,
  feedbacks: any[],
) {
  if (!node) return null; // phòng thủ nếu node undefined
  const folders = node.folders ? Object.keys(node.folders) : [];
  const files = node.files || [];
  return (
    <>
      {/* Render files ở thư mục gốc trước */}
      {parentPath === "" && files.length > 0 && (
        <>
          {files.map((file: any) => (
            <div
              key={file.id}
              className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all duration-150 ${
                selectedFile?.id === file.id ?
                  "bg-blue-100 text-blue-900 shadow-sm"
                : "hover:bg-gray-100"
              }`}
              onClick={() => setSelectedFile(file)}
            >
              {getFileIcon(file)}
              <span className="text-sm">{file.name}</span>
              {hasFeedbackForFile(feedbacks, file) && (
                <Badge className="ml-auto text-xs">
                  {countFeedbackForFile(feedbacks, file)}
                </Badge>
              )}
            </div>
          ))}
        </>
      )}
      {/* Render folder con */}
      {folders.map((folder) => {
        const fullPath = parentPath ? `${parentPath}/${folder}` : folder;
        const expanded = expandedFolders[fullPath] ?? true;
        return (
          <div key={fullPath}>
            <div
              className="flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors duration-150"
              onClick={() =>
                setExpandedFolders((prev) => ({
                  ...prev,
                  [fullPath]: !expanded,
                }))
              }
            >
              {expanded ?
                <FolderOpen className="h-4 w-4 text-amber-500" />
              : <Folder className="h-4 w-4 text-amber-500" />}
              <span className="text-sm font-medium">{folder}</span>
            </div>
            {expanded && (
              <div className="ml-6 space-y-1">
                {renderTree(
                  node.folders[folder],
                  fullPath,
                  expandedFolders,
                  setExpandedFolders,
                  selectedFile,
                  setSelectedFile,
                  feedbacks,
                )}
              </div>
            )}
          </div>
        );
      })}
      {/* Render files trong folder con */}
      {parentPath !== "" && files.length > 0 && (
        <>
          {files.map((file: any) => (
            <div
              key={file.id}
              className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all duration-150 ${
                selectedFile?.id === file.id ?
                  "bg-blue-100 text-blue-900 shadow-sm"
                : "hover:bg-gray-100"
              }`}
              onClick={() => setSelectedFile(file)}
            >
              {getFileIcon(file)}
              <span className="text-sm">{file.name}</span>
              {hasFeedbackForFile(feedbacks, file) && (
                <Badge className="ml-auto text-xs">
                  {countFeedbackForFile(feedbacks, file)}
                </Badge>
              )}
            </div>
          ))}
        </>
      )}
    </>
  );
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  setSelectedFile,
  expandedFolders,
  setExpandedFolders,
  feedbacks,
}) => {
  const safeFiles = Array.isArray(files) ? files : []; // đảm bảo luôn là mảng
  const tree = React.useMemo(() => buildFileTree(safeFiles), [safeFiles]);
  return (
    <div className="w-55 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3">Project Files</h3>
        <div className="space-y-1">
          {renderTree(
            tree,
            "",
            expandedFolders,
            setExpandedFolders,
            selectedFile,
            setSelectedFile,
            feedbacks,
          )}
        </div>
      </div>
    </div>
  );
};
