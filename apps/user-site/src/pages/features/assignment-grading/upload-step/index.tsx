import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploader } from "@/components/ui/file-uploader";
import { Rubric } from "@/types/rubric";
import { FileList } from "./file-list";
import CriteriaSelector from "./criteria-mapping";

export default function UploadStep() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<string>("");

  const rubrics: Rubric[] = [
    {
      rubricName: "Programming Assignment Rubric",
      performanceTags: [],
      criteria: [],
    },
  ];

  const handleRemoveFile = (fileName: string) => {
    const updatedFiles = uploadedFiles.filter((file) => file.name !== fileName);
    setUploadedFiles(updatedFiles);
  };

  const handleRemoveAllFiles = () => {
    setUploadedFiles([]);
  };

  const handleFileUpload = (files: File[]) => {
    const newFiles: File[] = files.filter(
      (file) => !uploadedFiles.some((existing) => existing.name === file.name)
    );

    if (newFiles.length > 0) {
      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
    }
  };

  return (
    <div className="size-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Select Rubric</h2>
        <div className="flex gap-4">
          <Select
            value={selectedRubric}
            onValueChange={(value) => {
              setSelectedRubric(value);
            }}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a rubric" />
            </SelectTrigger>
            <SelectContent>
              {rubrics.map((rubric, index) => (
                <SelectItem key={index} value={rubric.rubricName}>
                  {rubric.rubricName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">Create New Rubric</Button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Upload Files</h2>
        <FileUploader onFileUpload={handleFileUpload} accept=".zip" multiple />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Uploaded Files</h2>
          {uploadedFiles.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveAllFiles}
              className="text-destructive hover:text-destructive">
              Remove All
            </Button>
          )}
        </div>
        <FileList files={uploadedFiles} onDelete={handleRemoveFile} />
        {selectedRubric.length > 0 && uploadedFiles.length > 0 && (
          <CriteriaSelector uploadedFiles={uploadedFiles} />
        )}
      </div>
    </div>
  );
}
