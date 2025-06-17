import type { Rubric } from "@/types/rubric";
import { RubricView } from "@/components/app/rubric-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditRubric } from "@/components/app/edit-rubric";
import { Spinner } from "@/components/app/spinner";
import { useState } from "react";
import {
  PencilIcon,
  Plus,
  FileArchive,
  Trash2,
  FileText,
  File,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/app/file-uploader";

interface RubricTableProps {
  rubricData: Rubric;
  onUpdate?: (updatedRubric: Partial<Rubric>) => void;
  disableEdit?: boolean;
  isApplyingEdit?: boolean;
}

export default function ChatRubricTable({
  rubricData,
  onUpdate,
  disableEdit = false,
  isApplyingEdit = false,
}: RubricTableProps) {
  const [isEditingDialogOpen, setIsEditingDialogOpen] = useState(false);
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);

  return (
    <div className="flex flex-col size-full gap-4">
      <Card className="flex-1">
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{rubricData.rubricName}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsContextDialogOpen(true)}>
                <Plus className="size-4" /> Context
              </Button>
              <Button
                disabled={disableEdit || isApplyingEdit}
                onClick={() => setIsEditingDialogOpen(true)}
              >
                <PencilIcon className="size-4" /> Edit
              </Button>
            </div>
          </div>
          <CardDescription>
            Edit the rubric manually or use AI to modify it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {isApplyingEdit ?
            <div className="flex flex-col items-center justify-center h-full">
              <Spinner />
              <p>Agent is modifying the rubric. Please wait...</p>
            </div>
          : <div className="h-full overflow-y-auto relative">
              <div className="h-full absolute top-0 left-0 right-0">
                <RubricView rubricData={rubricData} />
              </div>
            </div>
          }
          {isEditingDialogOpen && (
            <EditRubric
              open={isEditingDialogOpen}
              onOpenChange={setIsEditingDialogOpen}
              rubricData={rubricData}
              onUpdate={onUpdate}
            />
          )}
          {isContextDialogOpen && (
            <RubricContextUploadDialog
              open={isContextDialogOpen}
              onOpenChange={setIsContextDialogOpen}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RubricContextUploadDialog({
  open,
  onOpenChange,
  onConfirm = () => {},
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (files: File[]) => void;
}) {
  const [contextFiles, setContextFiles] = useState<File[]>([]);

  const handleFileUpload = (files: File[]) => {
    setContextFiles((prev) => [...prev, ...files]);
  };

  const removeContextFile = (index: number) => {
    setContextFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Context Files</DialogTitle>
          <DialogDescription>
            Upload files to provide context for the rubric.
          </DialogDescription>
        </DialogHeader>
        <FileUploader onFileUpload={handleFileUpload} multiple />
        <div className="space-y-2">
          {contextFiles.map((file, index) => (
            <FileComponent
              key={index}
              file={file}
              index={index}
              onDelete={() => removeContextFile(index)}
            />
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => onConfirm(contextFiles)}>Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FileComponentProps {
  file: File;
  index: number;
  onDelete?: (index: number) => void;
}

function FileComponent({ file, onDelete, index }: FileComponentProps) {
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
      default:
        return { icon: File, color: "text-gray-400" };
    }
  };

  const { icon: IconComponent, color } = getFileTypeInfo(file.name);

  return (
    <div
      key={index}
      className="flex items-center justify-between p-3 bg-muted rounded-md"
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-white flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${color}`} />
        </div>
        <span className="font-medium max-w-48 truncate">{file.name}</span>
      </div>
      <div className="flex items-center space-x-3 flex-shrink-0">
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(index)}
            className="text-red-500 hover:text-red-600 hover:bg-white dark:hover:text-red-600 dark:hover:bg-red-50 size-8"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        )}
      </div>
    </div>
  );
}
