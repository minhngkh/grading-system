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
import Spinner from "@/components/spinner";

interface UploadStepProps {
  setNextCallback?: React.Dispatch<
    React.SetStateAction<
      ((handleSetIsUploading: (uploading: boolean) => void) => Promise<any>) | undefined
    >
  >;
  onGradingAttemptChange: (gradingAttempt?: Partial<GradingAttempt>) => void;
  gradingAttempt: GradingAttempt;
}

export default function UploadStep({
  onGradingAttemptChange,
  gradingAttempt,
  setNextCallback,
}: UploadStepProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setNextCallback?.(
      () => async (handleSetIsUploading: (uploading: boolean) => void) => {
        try {
          setIsUploading(true);
          handleSetIsUploading?.(true);
          await updateGradingAttempt(gradingAttempt.id, { ...gradingAttempt });
          await Promise.all(
            uploadedFiles.map(async (file, index) => {
              try {
                await uploadFile(gradingAttempt.id, file);

                const updatedProgress = Math.round(
                  ((index + 1) * 100) / uploadedFiles.length,
                );
                setProgress(updatedProgress);
              } catch (error) {
                console.log(error);
              }
            }),
          );
        } catch (error) {
          console.error("Error uploading files:", error);
        } finally {
          handleSetIsUploading?.(false);
          setIsUploading(false);
        }
      },
    );
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

  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <span className="text-lg font-semibold">Uploading...</span>
        <Spinner />
        <span>Progress: {progress}%</span>
      </div>
    );
  }

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
