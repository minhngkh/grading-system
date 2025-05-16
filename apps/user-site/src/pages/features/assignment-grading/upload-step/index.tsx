import type { Rubric } from "@/types/rubric";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/ui/file-uploader";
import { FileList } from "./file-list";
import { RubricSelect } from "@/components/scrollable-select";
import { GradingAttempt } from "@/types/grading";
import CriteriaMapper from "./criteria-mapping";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { updateGradingAttempt, uploadFile } from "@/services/gradingServices";

interface UploadStepProps {
  setNextCallback?: React.Dispatch<
    React.SetStateAction<(() => Promise<any>) | undefined>
  >;
  onGradingAttemptChange: (gradingAttempt?: Partial<GradingAttempt>) => void;
  gradingAttempt: GradingAttempt;
  setIsUploading?: (isUploading: boolean) => void;
}

export default function UploadStep({
  onGradingAttemptChange,
  gradingAttempt,
  setNextCallback,
  setIsUploading,
}: UploadStepProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    setNextCallback?.(() => async () => {
      try {
        setIsUploading?.(true);
        await updateGradingAttempt(gradingAttempt.id, { ...gradingAttempt });
        await Promise.all(
          uploadedFiles.map(async (file) => {
            try {
              await uploadFile(gradingAttempt.id, file);
            } catch (error) {
              console.log(error);
            }
          }),
        );
      } catch (error) {
        throw error;
      } finally {
        setIsUploading?.(false);
      }
    });
  }, [setNextCallback]);

  const handleSelectRubric = (rubric: Rubric | undefined) => {
    if (rubric) {
      const newGradingAttempt: GradingAttempt = {
        id: gradingAttempt.id,
        rubricId: rubric.id!,
        selectors: rubric.criteria.map((criterion) => {
          return { criterion: criterion.name, pattern: "*" };
        }),
      };

      onGradingAttemptChange(newGradingAttempt);
    } else {
      onGradingAttemptChange(undefined);
    }
  };

  const handleFileUpload = (files: File[]) => {
    const newFiles = files.filter(
      (file) => !uploadedFiles.some((existing) => existing.name === file.name),
    );

    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const handleRemoveFile = (i: number) => {
    const updatedFiles = uploadedFiles.filter((_, index) => index !== i);
    setUploadedFiles(updatedFiles);
  };

  const handleRemoveAllFiles = () => {
    setUploadedFiles([]);
  };

  return (
    <div className="size-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Select Rubric</h2>
        <div className="flex w-full gap-4">
          <RubricSelect onRubricChange={handleSelectRubric} />
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
            onGradingAttemptChange={onGradingAttemptChange}
            uploadedFiles={uploadedFiles}
          />
        )}
      </div>
    </div>
  );
}
