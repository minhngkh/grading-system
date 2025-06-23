import type { ZipNode } from "@/lib/zip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseZipToTree } from "@/lib/zip";
import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { GradingAttempt } from "@/types/grading";

interface ManualDialogProps {
  open: boolean;
  onClose: () => void;
  gradingAttempt: GradingAttempt;
  criterionIndex: number;
  uploadedFile: File;
  onSelect: (index: number, path: string) => void;
}

interface FileTreeNodeProps {
  node: ZipNode;
  level: number;
  currentPath: string;
  treeProps: {
    expandedFolders: Record<string, boolean>;
    onToggle: (path: string) => void;
    selectedPaths: string[];
    onToggleSelect: (path: string) => void;
  };
}

const FileTreeNode = memo(
  ({ node, level, currentPath, treeProps }: FileTreeNodeProps) => {
    const { expandedFolders, onToggle, selectedPaths, onToggleSelect } = treeProps;
    const isExpanded = expandedFolders[currentPath] || false;
    const isSelected = selectedPaths.includes(currentPath);

    if (node.type === "file") {
      return (
        <div
          className="flex items-center py-1 px-2 rounded-sm"
          style={{ marginLeft: `${(level + 1) * 12}px` }}
        >
          <File className="h-4 w-4 mr-2" />
          <span>{node.name}</span>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(currentPath)}
            className="ml-auto"
          />
        </div>
      );
    }

    return (
      <div>
        <div
          className="flex items-center py-1 px-2 rounded-sm"
          style={{ marginLeft: `${level * 12}px` }}
          onClick={() => onToggle(currentPath)}
        >
          {isExpanded ?
            <ChevronDown className="h-4 w-4 mr-1" />
          : <ChevronRight className="h-4 w-4 mr-1" />}
          <Folder className="h-4 w-4 mr-2" />
          <span>{node.name}</span>
          <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(currentPath)}
            />
          </div>
        </div>
        {isExpanded &&
          node.children?.map((child) => {
            const childPath = currentPath ? `${currentPath}/${child.name}` : child.name;
            return (
              <FileTreeNode
                key={childPath}
                node={child}
                level={level + 1}
                currentPath={childPath}
                treeProps={treeProps}
              />
            );
          })}
      </div>
    );
  },
);

// New helper: Normalize the pattern string into an array of selected paths.
const normalizePattern = (pattern: string): string[] =>
  pattern === "*" ? ["root"]
  : pattern.trim() !== "" ?
    pattern.split(" ").map((token) => (token === "root" ? "root" : "root/" + token))
  : [];

export function ManualLocationDialog({
  open,
  onClose,
  gradingAttempt,
  criterionIndex,
  uploadedFile,
  onSelect,
}: ManualDialogProps) {
  const criterionName = gradingAttempt.selectors[criterionIndex]?.criterion;

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    root: true,
  });
  const [fileSystem, setFileSystem] = useState<ZipNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>(() =>
    normalizePattern(gradingAttempt.selectors[criterionIndex]?.pattern || "*"),
  );

  // Update selectedPaths when gradingAttempt or criterionIndex changes
  useEffect(() => {
    const pattern = gradingAttempt.selectors[criterionIndex]?.pattern || "*";
    setSelectedPaths(normalizePattern(pattern));
  }, [gradingAttempt, criterionIndex]);

  // Memoized file parsing function
  const parseFile = useCallback(async () => {
    if (uploadedFile) {
      try {
        setError(null);
        setIsLoading(true);
        const tree = await parseZipToTree(uploadedFile);
        setFileSystem(tree);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to parse file");
        setFileSystem(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [uploadedFile]);

  useEffect(() => {
    parseFile();
  }, [parseFile]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  const toggleSelect = useCallback((path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  }, []);

  const onConfirm = useCallback(() => {
    if (selectedPaths.includes("root")) {
      onSelect(criterionIndex, "*");
      onClose();
      return;
    }
    const cleanedPaths = selectedPaths.map((p) =>
      p.startsWith("root/") ? p.substring(5) : p,
    );
    const joinedPaths = cleanedPaths.length ? cleanedPaths.join(" ") : "*";
    onSelect(criterionIndex, joinedPaths);
    onClose();
  }, [selectedPaths, criterionIndex, onSelect, onClose]);

  // Memoize context value to avoid re-renders in tree nodes
  const contextValue = useMemo(
    () => ({
      expandedFolders,
      onToggle: toggleFolder,
      selectedPaths,
      onToggleSelect: toggleSelect,
    }),
    [expandedFolders, toggleFolder, selectedPaths, toggleSelect],
  );

  // Memoized file tree renderer
  const renderFileTree = useCallback(
    (node: ZipNode, parentPath = "", level = 0) => {
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      return (
        <FileTreeNode
          key={currentPath}
          node={node}
          level={level}
          currentPath={currentPath}
          treeProps={contextValue}
        />
      );
    },
    [contextValue],
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="min-w-3xl max-h-[80vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Select File Location for {criterionName}</DialogTitle>
        </DialogHeader>
        <div className="border rounded-md p-4 max-h-[60vh] overflow-y-auto">
          {error ?
            <div>Cannot parse zip file. Please try another one!</div>
          : isLoading ?
            <div>Parsing file...</div>
          : fileSystem && renderFileTree(fileSystem)}
        </div>
        {/* Confirm Button */}
        <div className="flex justify-end">
          <Button onClick={onConfirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
