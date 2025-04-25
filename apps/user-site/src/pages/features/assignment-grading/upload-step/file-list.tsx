import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  File,
  FileText,
  ImageIcon,
  FileCode,
  FileArchive,
  Music,
  Video,
  Trash2,
  FolderOpen,
} from "lucide-react";

interface FileListProps {
  files: File[];
  onDelete?: (fileId: string) => void;
}

export function FileList({ files, onDelete }: FileListProps) {
  // Function to determine file type icon and badge text based on file extension
  const getFileInfo = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    let icon = <File className="h-5 w-5 text-gray-500" />;
    let type = extension.toUpperCase();

    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
      case "webp":
        icon = <ImageIcon className="h-5 w-5 text-blue-500" />;
        type = "Image";
        break;
      case "pdf":
        icon = <FileText className="h-5 w-5 text-red-500" />;
        type = "PDF";
        break;
      case "doc":
      case "docx":
        icon = <FileText className="h-5 w-5 text-blue-600" />;
        type = "Document";
        break;
      case "xls":
      case "xlsx":
        icon = <FileText className="h-5 w-5 text-green-600" />;
        type = "Spreadsheet";
        break;
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
      case "html":
      case "css":
        icon = <FileCode className="h-5 w-5 text-yellow-500" />;
        type = "Code";
        break;
      case "zip":
      case "rar":
      case "tar":
        icon = <FileArchive className="h-5 w-5 text-purple-500" />;
        type = "Archive";
        break;
      case "mp3":
      case "wav":
        icon = <Music className="h-5 w-5 text-pink-500" />;
        type = "Audio";
        break;
      case "mp4":
      case "avi":
      case "mov":
        icon = <Video className="h-5 w-5 text-indigo-500" />;
        type = "Video";
        break;
    }

    return { icon, type };
  };

  return (
    <Card className="w-full py-0 max-h-[400px] overflow-hidden">
      <CardContent className="p-0 overflow-y-auto max-h-[400px]">
        {files.length > 0 ? (
          <div className="divide-y">
            {files.map((file, index) => {
              const { icon, type } = getFileInfo(file.name);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-background">
                      {icon}
                    </div>
                    <span className="font-medium">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{type}</Badge>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(file.name)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No files have been uploaded yet. Upload some files to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
