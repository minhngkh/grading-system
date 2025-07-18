import React from "react";
import { FolderOpen, Folder } from "lucide-react";
import { getFileIcon } from "../../pages/assessment/edit-assessment/icon-utils";
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
    if (!selector || !selector.pattern) return false;

    const pattern = selector.pattern.trim();
    if (!pattern) return false;

    // Handle wildcard pattern that matches all files
    if (pattern === "*" || pattern === "**/*") return true;

    // Split pattern by spaces to handle multiple file patterns like "file1.cpp file2.cpp"
    const patterns = pattern.split(/\s+/).filter((p: string) => p.trim());

    // Check if the file name matches any of the patterns
    return patterns.some((singlePattern: string) => {
      singlePattern = singlePattern.trim();
      if (!singlePattern) return false;

      try {
        // Check if pattern is a regex (enclosed in forward slashes)
        if (singlePattern.startsWith("/") && singlePattern.endsWith("/")) {
          const regexPattern = singlePattern.slice(1, -1); // Remove surrounding slashes
          const regex = new RegExp(regexPattern, "i");
          return (
            regex.test(file.name) ||
            regex.test(file.relativePath || "") ||
            regex.test(file.path || "")
          );
        }

        // Check if pattern contains glob-like characters
        const hasGlobChars = /[*?[\]]/.test(singlePattern);

        if (hasGlobChars) {
          // Convert glob pattern to regex
          let regexPattern = singlePattern
            .replace(/\./g, "\\.") // escape dots first
            .replace(/\*\*/g, "DOUBLE_STAR") // temporarily replace ** to avoid conflicts
            .replace(/\*/g, "[^/]*") // * matches anything except /
            .replace(/DOUBLE_STAR/g, ".*") // ** matches anything including /
            .replace(/\?/g, "[^/]") // ? matches single character except /
            .replace(/\[/g, "\\[") // escape square brackets
            .replace(/\]/g, "\\]");

          regexPattern = `^${regexPattern}$`;
          const regex = new RegExp(regexPattern, "i");
          return (
            regex.test(file.name) ||
            regex.test(file.relativePath || "") ||
            regex.test(file.path || "")
          );
        } else {
          // Simple exact file name matching (case insensitive)
          return (
            file.name.toLowerCase() === singlePattern.toLowerCase() ||
            (file.relativePath &&
              file.relativePath.toLowerCase().endsWith(singlePattern.toLowerCase())) ||
            (file.path && file.path.toLowerCase().endsWith(singlePattern.toLowerCase()))
          );
        }
      } catch (error) {
        // If regex is invalid, fall back to simple string matching
        console.warn(`Invalid pattern: ${singlePattern}`, error);
        return file.name.toLowerCase() === singlePattern.toLowerCase();
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

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  setSelectedFile,
  expandedFolders,
  setExpandedFolders,
  feedbacks,
  grading,
}) => {
  const safeFiles = Array.isArray(files) ? files : []; // đảm bảo luôn là mảng
  const tree = React.useMemo(() => buildFileTree(safeFiles), [safeFiles]);

  // Access selectors directly from grading
  const selectors = grading?.selectors || [];

  return (
    <div className="h-full w-full flex flex-col min-w-0">
      <h3 className="text-sm font-medium mb-2">Explorer</h3>

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
          selectors,
        )}
      </div>
    </div>
  );
};
