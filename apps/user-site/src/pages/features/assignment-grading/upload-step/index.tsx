import type { Rubric } from "@/types/rubric";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/ui/file-uploader";
import { useState } from "react";
import { FileList } from "./file-list";
import { RubricSelect } from "@/components/scrollable-select";
import { GradingAttempt } from "@/types/grading";
import CriteriaMapper from "./criteria-mapping";
import { Link } from "@tanstack/react-router";

interface UploadStepProps {
  uploadedFiles: File[];
  onFilesChange: (files: File[]) => void;
  onGradingAttemptChange: (gradingAttempt?: GradingAttempt) => void;
}

export default function UploadStep({
  uploadedFiles,
  onFilesChange,
  onGradingAttemptChange,
}: UploadStepProps) {
  const [gradingAttempt, setGradingAttempt] = useState<GradingAttempt>();

  const handleSelectRubric = (rubric: Rubric | undefined) => {
    if (rubric) {
      const newGradingAttempt: GradingAttempt = {
        rubricId: rubric.id ?? "",
        selectors: rubric.criteria.map((criterion) => {
          return { criterion: criterion.name, pattern: "*" };
        }),
      };

      handleGradingAttemptChange(newGradingAttempt);
    } else {
      handleGradingAttemptChange(undefined);
    }
  };

  const handleGradingAttemptChange = (attempt?: GradingAttempt) => {
    setGradingAttempt(attempt);
    onGradingAttemptChange(attempt);
  };

  const handleFileUpload = (files: File[]) => {
    const newFiles = files.filter(
      (file) => !uploadedFiles.some((existing) => existing.name === file.name),
    );

    onFilesChange([...uploadedFiles, ...newFiles]);
  };

  const handleRemoveFile = (i: number) => {
    const updatedFiles = uploadedFiles.filter((_, index) => index !== i);
    onFilesChange(updatedFiles);
  };

  const handleRemoveAllFiles = () => {
    onFilesChange([]);
  };

  return (
    <div className="size-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Select Rubric</h2>
        <div className="flex w-full gap-4">
          <RubricSelect onChange={handleSelectRubric} />
          <Button variant="outline" asChild>
            <Link preload={false} to="/rubric-generation">
              Create New Rubric
            </Link>
          </Button>
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
        {gradingAttempt && uploadedFiles.length > 0 && (
          <CriteriaMapper
            gradingAttempt={gradingAttempt}
            onGradingAttemptChange={handleGradingAttemptChange}
            uploadedFiles={uploadedFiles}
          />
        )}
      </div>
    </div>
  );
}
