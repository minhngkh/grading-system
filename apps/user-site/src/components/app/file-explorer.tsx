import React from "react";
import { FolderOpen, Folder } from "lucide-react";
import { getFileIcon } from "../../pages/assessment/edit-assessment/icon-utils";
import { GradingAttempt } from "@/types/grading";

function buildFileTree(files: any[]) {
  const root: any = {};
  if (!Array.isArray(files)) return root;
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

interface FileExplorerProps {
  files: any[]; // <-- truyền mảng file có relativePath
  selectedFile: any;
  setSelectedFile: (file: any) => void;
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  feedbacks: any[];
  grading: GradingAttempt;
}

// Function to check if a file matches any selected criterion
function fileMatchesCriteria(file: any, selectedCriteria: string[], selectors: any[]) {
  // If no criteria selected, show all files
  if (selectedCriteria.length === 0) return true;

  return selectedCriteria.some((criterionName) => {
    const selector = selectors.find((sel) => sel.criterion === criterionName);
    if (!selector) return false;

    // Handle wildcard pattern that matches all files
    if (selector.pattern === "*" || selector.pattern === "**/*") return true;

    // Split pattern by spaces to handle multiple file patterns
    const patterns = selector.pattern.split(" ").filter((p: string) => p.trim());

    // Check if the file name matches any of the patterns
    return patterns.some((pattern: string) => {
      pattern = pattern.trim();
      if (!pattern) return false;

      try {
        // Check if pattern contains glob-like characters or regex special chars
        const hasGlobChars = /[*?[\]{}]/.test(pattern);
        const hasRegexChars = /[.*+?^${}()|[\]\\]/.test(pattern);

        if (hasGlobChars || hasRegexChars) {
          // Convert glob pattern to regex or treat as regex
          let regexPattern = pattern;

          // If it looks like a glob pattern, convert to regex
          if (hasGlobChars && !pattern.startsWith("/") && !pattern.endsWith("/")) {
            // Convert glob to regex
            regexPattern = pattern
              .replace(/\*\*/g, ".*") // ** matches anything including /
              .replace(/\*/g, "[^/]*") // * matches anything except /
              .replace(/\?/g, "[^/]") // ? matches single character except /
              .replace(/\./g, "\\."); // escape dots
            regexPattern = `^${regexPattern}$`;
          }

          const regex = new RegExp(regexPattern, "i"); // case insensitive
          return (
            regex.test(file.name) ||
            regex.test(file.relativePath || "") ||
            regex.test(file.path || "")
          );
        } else {
          // Simple file name matching - exact match
          return file.name === pattern;
        }
      } catch (error) {
        // If regex is invalid, fall back to simple string matching
        console.warn(`Invalid pattern: ${pattern}`, error);
        return file.name === pattern;
      }
    });
  });
}

// Function to check if a folder contains any matching files
function folderContainsMatchingFiles(
  node: any,
  selectedCriteria: string[],
  selectors: any[],
): boolean {
  // If no criteria selected, show all folders
  if (selectedCriteria.length === 0) return true;

  // Check files in this folder
  if (
    node.files &&
    node.files.some((file: any) => fileMatchesCriteria(file, selectedCriteria, selectors))
  ) {
    return true;
  }

  // Check subfolders
  if (node.folders) {
    return Object.values(node.folders).some((subfolder: any) =>
      folderContainsMatchingFiles(subfolder, selectedCriteria, selectors),
    );
  }

  return false;
}

function renderTree(
  node: any,
  parentPath: string,
  expandedFolders: Record<string, boolean>,
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  selectedFile: any,
  setSelectedFile: (file: any) => void,
  feedbacks: any[],
  selectedCriteria: string[],
  selectors: any[],
) {
  if (!node) return null; // phòng thủ nếu node undefined
  const folders = node.folders ? Object.keys(node.folders) : [];
  const files = node.files || [];

  return (
    <>
      {/* Render files ở thư mục gốc trước */}
      {parentPath === "" && files.length > 0 && (
        <>
          {files
            .filter((file: any) => fileMatchesCriteria(file, selectedCriteria, selectors))
            .map((file: any) => (
              <div
                key={file.id}
                className={`flex items-center gap-1.5 py-1 px-2 rounded-sm cursor-pointer transition-all duration-150 min-w-0 ${
                  selectedFile?.id === file.id ? "bg-muted shadow-sm" : "hover:bg-muted"
                }`}
                onClick={() => setSelectedFile(file)}
                title={file.name}
              >
                <div className="flex-shrink-0">{getFileIcon(file)}</div>
                <span className="text-xs truncate min-w-0 flex-1">{file.name}</span>
              </div>
            ))}
        </>
      )}

      {/* Render folder con */}
      {folders.map((folder) => {
        const fullPath = parentPath ? `${parentPath}/${folder}` : folder;
        const expanded = expandedFolders[fullPath] ?? true;

        // Skip folders that don't contain any matching files when filtering
        if (
          selectedCriteria.length > 0 &&
          !folderContainsMatchingFiles(node.folders[folder], selectedCriteria, selectors)
        ) {
          return null;
        }

        return (
          <div key={fullPath}>
            <div
              className="flex items-center gap-1.5 py-1 px-2 rounded-sm cursor-pointer hover:bg-muted transition-colors duration-150 min-w-0"
              onClick={() =>
                setExpandedFolders((prev) => ({
                  ...prev,
                  [fullPath]: !expanded,
                }))
              }
              title={folder}
            >
              <div className="flex-shrink-0">
                {expanded ?
                  <FolderOpen className="h-4 w-4 text-amber-500" />
                : <Folder className="h-4 w-4 text-amber-500" />}
              </div>
              <span className="text-xs font-medium truncate min-w-0 flex-1">
                {folder}
              </span>
            </div>
            {expanded && (
              <div className="ml-4 space-y-0.5">
                {renderTree(
                  node.folders[folder],
                  fullPath,
                  expandedFolders,
                  setExpandedFolders,
                  selectedFile,
                  setSelectedFile,
                  feedbacks,
                  selectedCriteria,
                  selectors,
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Render files trong folder con */}
      {parentPath !== "" && files.length > 0 && (
        <>
          {files
            .filter((file: any) => fileMatchesCriteria(file, selectedCriteria, selectors))
            .map((file: any) => (
              <div
                key={file.id}
                className={`flex items-center gap-1.5 py-1 px-2 rounded-sm cursor-pointer transition-all duration-150 min-w-0 ${
                  selectedFile?.id === file.id ? "bg-muted shadow-sm" : "hover:bg-muted"
                }`}
                onClick={() => setSelectedFile(file)}
                title={file.name}
              >
                <div className="flex-shrink-0">{getFileIcon(file)}</div>
                <span className="text-xs truncate min-w-0 flex-1">{file.name}</span>
              </div>
            ))}
        </>
      )}
    </>
  );
}

export const FileExplorer: React.FC<FileExplorerProps> = React.memo(
  ({
    files,
    selectedFile,
    setSelectedFile,
    expandedFolders,
    setExpandedFolders,
    feedbacks,
    grading,
  }) => {
    const tree = React.useMemo(() => buildFileTree(files), [files]);

    return (
      <div className="p-4 h-full w-full flex flex-col min-w-0">
        <h3 className="text-sm font-medium mb-2">File Explorer</h3>

        <div className="flex-1 overflow-auto space-y-0.5 min-w-0">
          {renderTree(
            tree,
            "",
            expandedFolders,
            setExpandedFolders,
            selectedFile,
            setSelectedFile,
            feedbacks,
            [],
            grading.selectors,
          )}
        </div>
      </div>
    );
  },
);

FileExplorer.displayName = "FileExplorer";
