import type { Rubric } from "@/types/rubric";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/ui/file-uploader";
import { useState } from "react";
import CriteriaSelector from "./criteria-mapping";
import { FileList } from "./file-list";
import { RubricSelect } from "@/components/scrollable-select";
import { CriteriaMapping } from "@/types/grading";

export default function UploadStep() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | undefined>();
  const [criteriaMapping, setCriteriaMapping] = useState<CriteriaMapping[]>([]);

  const handleSelectRubric = (rubric: Rubric | undefined) => {
    setSelectedRubric(rubric);
    if (rubric) {
      const newMapping: CriteriaMapping[] = rubric.criteria.map((criterion) => {
        return { criteriaName: criterion.name, filePath: "" };
      });

      setCriteriaMapping(newMapping);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    const updatedFiles = uploadedFiles.filter((file) => file.name !== fileName);
    setUploadedFiles(updatedFiles);
  };

  const handleRemoveAllFiles = () => {
    setUploadedFiles([]);
  };

  const handleFileUpload = (files: File[]) => {
    const newFiles: File[] = files.filter(
      (file) => !uploadedFiles.some((existing) => existing.name === file.name),
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
        <div className="flex w-full gap-4">
          <RubricSelect onChange={handleSelectRubric} />
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
              className="text-destructive hover:text-destructive"
            >
              Remove All
            </Button>
          )}
        </div>
        <FileList files={uploadedFiles} onDelete={handleRemoveFile} />
        {selectedRubric && uploadedFiles.length > 0 && (
          <CriteriaSelector
            criteriaMapping={criteriaMapping}
            onCriteriaMappingChange={setCriteriaMapping}
            uploadedFiles={uploadedFiles}
          />
        )}
      </div>
    </div>
  );
}
