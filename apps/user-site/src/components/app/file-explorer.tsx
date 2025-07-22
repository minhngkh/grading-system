import React, { useState } from "react";
import { FolderOpen, Folder, Filter } from "lucide-react";
import { getFileIcon } from "../../pages/assessment/edit-assessment/icon-utils";
import { GradingAttempt } from "@/types/grading";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileItem } from "@/types/file";
import { FeedbackItem } from "@/types/assessment";
function buildFileTree(files: FileItem[]) {
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

interface FileExplorerProps {
  files: FileItem[];
  selectedFile: FileItem | null;
  setSelectedFile: (file: FileItem) => void;
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  feedbacks: FeedbackItem[];
  grading: GradingAttempt;
}

function fileMatchesCriteria(
  file: FileItem,
  selectedCriteria: string[],
  selectors: any[],
) {
  if (selectedCriteria.length === 0) return true;

  return selectedCriteria.some((criterionName) => {
    const selector = selectors.find((sel) => sel.criterion === criterionName);
    if (!selector || !selector.pattern) return false;

    const pattern = selector.pattern.trim();
    if (!pattern) return false;

    if (pattern === "*" || pattern === "**/*") return true;

    const patterns = pattern.split(/\s+/).filter((p: string) => p.trim());

    return patterns.some((singlePattern: string) => {
      singlePattern = singlePattern.trim();
      if (!singlePattern) return false;

      try {
        if (singlePattern.startsWith("/") && singlePattern.endsWith("/")) {
          const regexPattern = singlePattern.slice(1, -1);
          const regex = new RegExp(regexPattern, "i");
          return (
            regex.test(file.name) ||
            regex.test(file.relativePath || "") ||
            regex.test(file.path || "")
          );
        }

        const hasGlobChars = /[*?[\]]/.test(singlePattern);

        if (hasGlobChars) {
          let regexPattern = singlePattern
            .replace(/\./g, "\\.")
            .replace(/\*\*/g, "DOUBLE_STAR")
            .replace(/\*/g, "[^/]*")
            .replace(/DOUBLE_STAR/g, ".*")
            .replace(/\?/g, "[^/]")
            .replace(/\[/g, "\\[")
            .replace(/\]/g, "\\]");

          regexPattern = `^${regexPattern}$`;
          const regex = new RegExp(regexPattern, "i");
          return (
            regex.test(file.name) ||
            regex.test(file.relativePath || "") ||
            regex.test(file.path || "")
          );
        } else {
          return (
            file.name.toLowerCase() === singlePattern.toLowerCase() ||
            (file.relativePath &&
              file.relativePath.toLowerCase().endsWith(singlePattern.toLowerCase())) ||
            (file.path && file.path.toLowerCase().endsWith(singlePattern.toLowerCase()))
          );
        }
      } catch (error) {
        console.warn(`Invalid pattern: ${singlePattern}`, error);
        return file.name.toLowerCase() === singlePattern.toLowerCase();
      }
    });
  });
}

function folderContainsMatchingFiles(
  node: any,
  selectedCriteria: string[],
  selectors: any[],
): boolean {
  if (selectedCriteria.length === 0) return true;

  if (
    node.files &&
    node.files.some((file: any) => fileMatchesCriteria(file, selectedCriteria, selectors))
  ) {
    return true;
  }

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
  selectedFile: FileItem | null,
  setSelectedFile: (file: FileItem) => void,
  feedbacks: FeedbackItem[],
  selectedCriteria: string[],
  selectors: any[],
) {
  if (!node) return null;
  const folders = node.folders ? Object.keys(node.folders) : [];
  const files = node.files || [];

  return (
    <>
      {/* Render files ở thư mục gốc trước */}
      {parentPath === "" && files.length > 0 && (
        <>
          {files
            .filter((file: FileItem) =>
              fileMatchesCriteria(file, selectedCriteria, selectors),
            )
            .map((file: FileItem) => (
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
            .filter((file: FileItem) =>
              fileMatchesCriteria(file, selectedCriteria, selectors),
            )
            .map((file: FileItem) => (
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
  const safeFiles = Array.isArray(files) ? files : [];
  const tree = React.useMemo(() => buildFileTree(safeFiles), [safeFiles]);

  const selectors = grading?.selectors || [];

  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);

  const toggleCriterion = (criterion: string) => {
    setSelectedCriteria((prev) =>
      prev.includes(criterion) ?
        prev.filter((c) => c !== criterion)
      : [...prev, criterion],
    );
  };

  return (
    <div className="h-full w-full flex flex-col min-w-0">
      <div className="justify-between flex items-center">
        <h3 className="text-sm font-medium mb-2">Explorer</h3>
        <Popover>
          <div className="flex items-center gap-1 flex-shrink-0">
            {selectedCriteria.length > 0 && (
              <Badge className="text-[10px] h-4 px-1">{selectedCriteria.length}</Badge>
            )}
            <PopoverTrigger asChild>
              <button className="p-1 rounded hover:bg-muted transition-colors">
                <Filter className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
              </button>
            </PopoverTrigger>
          </div>
          <PopoverContent className="w-80">
            <h3 className="text-sm font-medium mb-2">Filter files by criterion</h3>
            {selectors.length > 0 ?
              <div className="space-y-2 max-h-60 overflow-auto">
                {selectors.map((selector) => {
                  return (
                    <div key={selector.criterion} className="flex items-start space-x-2">
                      <Checkbox
                        id={`criterion-${selector.criterion}`}
                        checked={selectedCriteria.includes(selector.criterion)}
                        onCheckedChange={() => toggleCriterion(selector.criterion)}
                      />
                      <div className="grid gap-1.5 leading-none flex-1">
                        <Label
                          htmlFor={`criterion-${selector.criterion}`}
                          className="text-xs font-medium cursor-pointer"
                        >
                          {selector.criterion}
                        </Label>
                        {selector.pattern && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <p className="text-xs text-muted-foreground">
                                Pattern: {selector.pattern}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            : <p className="text-xs text-muted-foreground">No criteria available</p>}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 custom-scrollbar">
        {renderTree(
          tree,
          "",
          expandedFolders,
          setExpandedFolders,
          selectedFile,
          setSelectedFile,
          feedbacks,
          selectedCriteria,
          selectors,
        )}
      </div>
    </div>
  );
};
