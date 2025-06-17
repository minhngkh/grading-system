import { useState, useCallback, memo, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, File, FileText, FileArchive, Image, Code } from "lucide-react";
import { FileUploader } from "@/components/app/file-uploader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface RubricContextUploadDialogProps {
  attachments?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (files: File[], attachments: string[]) => void;
}

export const RubricContextUploadDialog = memo(
  ({ open, onOpenChange, onConfirm, attachments }: RubricContextUploadDialogProps) => {
    const [contextFiles, setContextFiles] = useState<File[]>([]);
    const [currentAttachments, setCurrentAttachments] = useState<string[]>([]);

    // Reset state when dialog opens/closes
    useEffect(() => {
      if (open) {
        setCurrentAttachments(attachments || []);
        setContextFiles([]);
      }
    }, [open, attachments]);

    const handleFileUpload = useCallback((files: File[]) => {
      if (files.length === 0) return;

      setContextFiles((prev) => {
        const existingNames = prev.map((f) => f.name);
        const newFiles = files.filter((file) => !existingNames.includes(file.name));
        return [...prev, ...newFiles];
      });
    }, []);

    const handleDeleteFile = useCallback((index: number) => {
      setContextFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleRemoveAttachment = useCallback((file: string) => {
      setCurrentAttachments((prev) => prev.filter((f) => f !== file));
    }, []);

    const handleConfirm = useCallback(() => {
      onConfirm?.(contextFiles, currentAttachments);
    }, [contextFiles, currentAttachments, onConfirm]);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Context Files</DialogTitle>
            <DialogDescription>
              Upload files to provide context when grading the rubric.
            </DialogDescription>
          </DialogHeader>
          <FileUploader onFileUpload={handleFileUpload} multiple />
          {contextFiles.length > 0 && (
            <div className="space-y-2 border rounded-md p-4">
              <Label htmlFor="context-files">Context Files to be added</Label>
              {contextFiles.map((file, index) => (
                <FileComponent
                  key={`new-${file.name}-${index}`}
                  file={file.name}
                  index={index}
                  onDelete={() => handleDeleteFile(index)}
                />
              ))}
            </div>
          )}
          {currentAttachments.length > 0 && (
            <div className="space-y-2 border rounded-md p-4">
              <Label htmlFor="current-attachments">Current Context Files</Label>
              {currentAttachments.map((file, index) => (
                <FileComponent
                  key={`existing-${file}-${index}`}
                  file={file}
                  index={index}
                  onDelete={() => handleRemoveAttachment(file)}
                />
              ))}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

interface FileComponentProps {
  file: string;
  index: number;
  onDelete?: () => void;
}

const FileComponent = memo(({ file, onDelete, index }: FileComponentProps) => {
  const getFileTypeInfo = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return { icon: FileText, color: "text-red-500" };
      case "doc":
      case "docx":
        return { icon: FileText, color: "text-blue-500" };
      case "txt":
        return { icon: FileText, color: "text-gray-500" };
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return { icon: Image, color: "text-green-500" };
      case "zip":
      case "rar":
      case "7z":
        return { icon: FileArchive, color: "text-purple-500" };
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
      case "json":
      case "html":
      case "css":
      case "py":
      case "java":
      case "cpp":
      case "c":
      case "cs":
      case "rb":
      case "go":
      case "rs":
        return { icon: Code, color: "text-yellow-500" };
      default:
        return { icon: File, color: "text-gray-400" };
    }
  };

  const { icon: IconComponent, color } = getFileTypeInfo(file);

  return (
    <div
      key={index}
      className="flex items-center justify-between p-3 bg-muted rounded-md"
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-background flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${color}`} />
        </div>
        <span className="font-medium max-w-48 truncate">{file}</span>
      </div>
      <div className="flex items-center space-x-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-red-500 hover:text-red-600 hover:bg-white dark:hover:text-red-600 dark:hover:bg-red-50 size-8"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
});
