import React from "react";
import { FolderOpen, Folder, Badge } from "lucide-react";
import { getFileIcon } from "./icon-utils";

interface FileExplorerProps {
  filesByFolder: Record<string, any[]>;
  selectedFile: any;
  setSelectedFile: (file: any) => void;
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  feedbacks: any[];
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  filesByFolder,
  selectedFile,
  setSelectedFile,
  expandedFolders,
  setExpandedFolders,
  feedbacks,
}) => (
  <div className="w-55 overflow-y-auto">
    <div className="p-4">
      <h3 className="text-sm font-medium mb-3">Project Files</h3>
      <div className="space-y-1">
        {Object.entries(filesByFolder).map(([folder, filesInFolder]) => (
          <div key={folder}>
            {folder !== "root" && (
              <div
                className="flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                onClick={() =>
                  setExpandedFolders((prev) => ({
                    ...prev,
                    [folder]: !prev[folder],
                  }))
                }
              >
                {expandedFolders[folder] ?
                  <FolderOpen className="h-4 w-4 text-amber-500" />
                : <Folder className="h-4 w-4 text-amber-500" />}
                <span className="text-sm font-medium">{folder}</span>
              </div>
            )}

            {(folder === "root" || expandedFolders[folder]) && (
              <div className={folder !== "root" ? "ml-6 space-y-1" : "space-y-1"}>
                {(filesInFolder as any[]).map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all duration-150 ${
                      selectedFile?.id === file.id ?
                        "bg-blue-100 text-blue-900 shadow-sm"
                      : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    {getFileIcon(file)}
                    <span className="text-sm">{file.name}</span>
                    {feedbacks.some(
                      (f) => f.fileRef === file.name || f.fileRef === file.path,
                    ) && (
                      <Badge className="ml-auto text-xs">
                        {
                          feedbacks.filter(
                            (f) => f.fileRef === file.name || f.fileRef === file.path,
                          ).length
                        }
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);
