import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  memo,
} from "react";
import { ChevronDown, ChevronRight, Folder, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ZipNode, parseZipToTree } from "@/lib/zip";

interface ManualDialogProps {
  open: boolean;
  onClose: () => void;
  criterionName: string;
  criterionIndex: number;
  uploadedFiles: File[];
  onSelect: (index: number, path: string) => void;
}

interface FileTreeContextType {
  expandedFolders: Record<string, boolean>;
  onToggle: (path: string) => void;
  criterionIndex: number;
  onSelect: (path: string) => void;
}

interface FileTreeNodeProps {
  node: ZipNode;
  level: number;
  currentPath: string;
}

const FileTreeContext = createContext<FileTreeContextType>(
  {} as FileTreeContextType
);

const FileTreeNode = memo(({ node, level, currentPath }: FileTreeNodeProps) => {
  const { expandedFolders, onToggle, onSelect } = useContext(FileTreeContext);
  const isExpanded = expandedFolders[currentPath] || false;

  if (node.type === "file") {
    return (
      <div
        className="flex items-center py-1 px-2 hover:bg-muted rounded-sm"
        style={{ marginLeft: `${(level + 1) * 12}px` }}>
        <File className="h-4 w-4 mr-2" />
        <span>{node.name}</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-6"
          onClick={() => onSelect(currentPath)}>
          Select
        </Button>
      </div>
    );
  }

  return (
    <div className="select-none">
      <div
        className="flex items-center py-1 px-2 hover:bg-muted rounded-sm"
        style={{ marginLeft: `${level * 12}px` }}
        onClick={() => onToggle(currentPath)}>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 mr-1" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-1" />
        )}
        <Folder className="h-4 w-4 mr-2" />
        <span>{node.name}</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-6"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(currentPath);
          }}>
          Select
        </Button>
      </div>

      {isExpanded &&
        node.children?.map((child) => {
          const childPath = currentPath
            ? `${currentPath}/${child.name}`
            : child.name;
          return (
            <FileTreeNode
              key={childPath}
              node={child}
              level={level + 1}
              currentPath={childPath}
            />
          );
        })}
    </div>
  );
});

export function ManualLocationDialog({
  open,
  onClose,
  criterionName,
  criterionIndex,
  uploadedFiles,
  onSelect,
}: ManualDialogProps) {
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({
    root: true,
  });
  const [fileSystem, setFileSystem] = useState<ZipNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const parseFile = async () => {
      if (uploadedFiles && uploadedFiles.length > 0) {
        try {
          setError(null);
          setIsLoading(true);
          const tree = await parseZipToTree(uploadedFiles[0]);
          setFileSystem(tree);
        } catch (err) {
          console.log(err);
          setError(err instanceof Error ? err.message : "Failed to parse file");
          setFileSystem(null);
        } finally {
          setIsLoading(false);
        }
      }
    };
    parseFile();
  }, [uploadedFiles]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const renderFileTree = useCallback(
    (node: ZipNode, criterionIndex: number, parentPath = "", level = 0) => {
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      return (
        <FileTreeContext.Provider
          value={{
            expandedFolders,
            onToggle: toggleFolder,
            criterionIndex,
            onSelect: (path) => onSelect(criterionIndex, path),
          }}>
          <FileTreeNode
            key={currentPath}
            node={node}
            level={level}
            currentPath={currentPath}
          />
        </FileTreeContext.Provider>
      );
    },
    [expandedFolders, toggleFolder, onSelect]
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="min-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select File Location for {criterionName}</DialogTitle>
        </DialogHeader>
        <div className="border rounded-md p-4 max-h-[60vh] overflow-y-auto">
          {error ? (
            <div>Cannot parse zip file. Please try another one!</div>
          ) : (
            <>
              {isLoading ? (
                <div>Parsing file...</div>
              ) : (
                fileSystem && renderFileTree(fileSystem, criterionIndex)
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
