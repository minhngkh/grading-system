import { useState, useCallback, memo } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, File, FileText, FileArchive, Image, Code, Plus } from "lucide-react";
import { FileUploader } from "@/components/app/file-uploader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface KeyValuePair {
  key: string;
  value: string;
}

interface RubricContextUploadDialogProps {
  attachments?: string[];
  metadata?: Record<string, string>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: (
    files: File[],
    attachments?: string[],
    metadata?: Record<string, string>,
  ) => Promise<void>;
  isPending?: boolean;
}

export const RubricContextUploadDialog = memo(
  ({
    open,
    onOpenChange,
    onConfirm,
    attachments,
    metadata,
    isPending,
  }: RubricContextUploadDialogProps) => {
    const [contextFiles, setContextFiles] = useState<File[]>([]);
    const [currentAttachments, setCurrentAttachments] = useState<string[] | undefined>(
      attachments,
    );
    const [currentKeyValuePairs, setCurrentKeyValuePairs] = useState<KeyValuePair[]>(
      metadata && Object.entries(metadata).length > 0 ?
        Object.entries(metadata).map(([key, value]) => ({ key, value }))
      : [{ key: "", value: "" }],
    );
    const [validationErrors, setValidationErrors] = useState<(string | null)[]>([]);

    const handleFileUpload = useCallback((files: File[]) => {
      if (files.length === 0) return;

      setContextFiles((prev) => {
        const existingNames = prev.map((f) => f.name);
        const newFiles = files.filter((file) => !existingNames.includes(file.name));
        return [...prev, ...newFiles];
      });
    }, []);

    const handleRemoveKeyValuePair = useCallback((index: number) => {
      setCurrentKeyValuePairs((prev) => {
        if (prev.length <= 1) {
          return [{ key: "", value: "" }];
        }
        return prev.filter((_, i) => i !== index);
      });
      setValidationErrors((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleUpdateKeyValuePair = useCallback(
      (index: number, field: "key" | "value", newValue: string) => {
        setCurrentKeyValuePairs((prev) =>
          prev.map((pair, i) => (i === index ? { ...pair, [field]: newValue } : pair)),
        );
        setValidationErrors((prev) => {
          const newErrors = [...prev];
          newErrors[index] = null;
          return newErrors;
        });
      },
      [],
    );

    const resetState = useCallback(() => {
      setContextFiles([]);
      setCurrentAttachments([]);
      setCurrentKeyValuePairs([{ key: "", value: "" }]);
      setValidationErrors([]);
    }, []);

    const validateMetadata = useCallback(() => {
      const errors: (string | null)[] = [];
      let isValid = true;
      const seenKeys = new Set<string>();

      currentKeyValuePairs.forEach((pair, index) => {
        const hasKey = pair.key.trim() !== "";
        const hasValue = pair.value.trim() !== "";
        const trimmedKey = pair.key.trim();

        if (hasKey && !hasValue) {
          errors[index] = "Value is required when key is provided";
          isValid = false;
        } else if (!hasKey && hasValue) {
          errors[index] = "Key is required when value is provided";
          isValid = false;
        } else if (currentKeyValuePairs.length > 1 && !hasKey && !hasValue) {
          errors[index] = "Both key and value are required";
          isValid = false;
        } else if (hasKey && seenKeys.has(trimmedKey)) {
          errors[index] = "Duplicate key is not allowed";
          isValid = false;
        } else {
          errors[index] = null;
          if (hasKey) {
            seenKeys.add(trimmedKey);
          }
        }
      });

      setValidationErrors(errors);
      return isValid;
    }, [currentKeyValuePairs]);

    const handleConfirm = useCallback(async () => {
      if (!validateMetadata()) return;

      const validKeyValuePairs = currentKeyValuePairs
        .filter((pair) => pair.key.trim() !== "" && pair.value.trim() !== "")
        .reduce(
          (acc, pair) => {
            acc[pair.key] = pair.value;
            return acc;
          },
          {} as Record<string, string>,
        );

      const finalMetadata =
        (
          currentKeyValuePairs.length === 1 &&
          currentKeyValuePairs[0].key.trim() === "" &&
          currentKeyValuePairs[0].value.trim() === ""
        ) ?
          {}
        : validKeyValuePairs;

      await onConfirm?.(contextFiles, currentAttachments, finalMetadata);
      onOpenChange?.(false);
      resetState();
    }, [
      contextFiles,
      currentAttachments,
      currentKeyValuePairs,
      onConfirm,
      onOpenChange,
      validateMetadata,
      resetState,
    ]);

    const handleCancel = useCallback(() => {
      onOpenChange?.(false);
      resetState();
    }, [onOpenChange]);

    return (
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="max-w-[90vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Context</DialogTitle>
            <DialogDescription>
              Upload files or add metadata to provide context when grading the rubric
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Metadata</Label>
            <div className="space-y-2 border rounded-md p-4">
              {currentKeyValuePairs.map((pair, index) => (
                <KeyValueComponent
                  key={`kv-${index}`}
                  keyValue={pair}
                  index={index}
                  onDelete={() => handleRemoveKeyValuePair(index)}
                  onUpdate={(field, value) =>
                    handleUpdateKeyValuePair(index, field, value)
                  }
                  error={validationErrors[index]}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentKeyValuePairs((prev) => [...prev, { key: "", value: "" }])
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Upload Files</Label>
              <FileUploader onFileUpload={handleFileUpload} multiple />
            </div>

            {contextFiles.length > 0 && (
              <div className="space-y-2 border rounded-md p-4">
                <Label>Context Files to be added</Label>
                <div>
                  {contextFiles.map((file, index) => (
                    <FileComponent
                      key={`new-${file.name}-${index}`}
                      file={file.name}
                      index={index}
                      onDelete={() =>
                        setContextFiles((prev) => prev.filter((_, i) => i !== index))
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {currentAttachments && currentAttachments.length > 0 && (
              <div className="space-y-2 border rounded-md p-4">
                <Label>Current Context Files</Label>
                <div>
                  {currentAttachments.map((file, index) => (
                    <FileComponent
                      key={`existing-${file}-${index}`}
                      file={file}
                      index={index}
                      onDelete={() =>
                        setCurrentAttachments((prev) => prev?.filter((f) => f !== file))
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </DialogClose>
            {isPending ?
              <Button>Uploading</Button>
            : <Button onClick={handleConfirm}>Confirm</Button>}
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

interface KeyValueComponentProps {
  keyValue: KeyValuePair;
  index: number;
  onDelete?: () => void;
  onUpdate?: (field: "key" | "value", value: string) => void;
  error?: string | null;
}

const KeyValueComponent = memo(
  ({ keyValue, onDelete, index, onUpdate, error }: KeyValueComponentProps) => {
    const keyId = `key-${index}`;
    const valueId = `value-${index}`;

    return (
      <div key={index} className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Input
                id={keyId}
                name={keyId}
                value={keyValue.key}
                onChange={(e) => onUpdate?.("key", e.target.value)}
                className={`max-w-36 text-sm ${error ? "border-red-500" : ""}`}
                placeholder="Option"
              />
              <Input
                id={valueId}
                name={valueId}
                value={keyValue.value}
                onChange={(e) => onUpdate?.("value", e.target.value)}
                className={`text-sm ${error ? "border-red-500" : ""}`}
                placeholder="Value"
              />
            </div>
            <Button variant="destructive" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-red-500 ml-1">{error}</p>}
      </div>
    );
  },
);
