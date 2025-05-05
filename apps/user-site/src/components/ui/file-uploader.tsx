import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, FileWarning } from "lucide-react";

interface FileUploaderProps {
  onFileUpload: (files: File[], uploadId: string) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
}

export function FileUploader({
  onFileUpload,
  accept = "*",
  multiple = false,
  maxSize = 50, // Default 100MB
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): boolean => {
    setError(null);
    let errors: string[] = [];

    if (!files.length) return false;

    for (const file of files) {
      if (file.size > maxSize * 1024 * 1024) {
        errors.push(`File ${file.name} is larger than ${maxSize}MB`);
      }

      if (accept !== "*") {
        const acceptedTypes = accept
          .split(",")
          .map((type) => type.trim().toLowerCase().replace(".", ""));

        // Check both file extension and MIME type
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
        const fileMimeType = file.type.toLowerCase();

        const isValidType = acceptedTypes.some(
          (type) => fileExt === type || fileMimeType.includes(type),
        );

        if (!isValidType) {
          errors.push(`File ${file.name} is not an accepted file type`);
        }
      }
    }

    if (errors.length > 0) {
      setError(errors.join("; "));
      return false;
    }
    return true;
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      if (validateFiles(fileArray)) {
        const id = crypto.randomUUID();
        onFileUpload(fileArray, id);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onFileUpload, accept, maxSize],
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className="w-full">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6",
          "flex flex-col items-center justify-center gap-4",
          "transition-colors duration-200",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          "cursor-pointer",
        )}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />

        <Upload className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="text-muted-foreground">
            Drag & drop files here, or click to select files
          </p>
          <p className="text-sm text-muted-foreground/75">
            {multiple ? "Upload multiple files" : "Upload one file"}
            {accept !== "*" && ` (${accept})`}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <FileWarning className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
