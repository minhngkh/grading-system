import type { Rubric } from "@/types/rubric";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/ui/file-uploader";
import { FileList } from "./file-list";
import { RubricSelect } from "@/components/app/scrollable-select";
import { GradingAttempt } from "@/types/grading";
import CriteriaMapper from "./criteria-mapping";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  updateGradingRubric,
  updateGradingSelectors,
  uploadSubmission,
} from "@/services/grading-service";
import Spinner from "@/components/app/spinner";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UploadStepProps {
  onGradingAttemptChange: (gradingAttempt?: Partial<GradingAttempt>) => void;
  gradingAttempt: GradingAttempt;
}

export default function UploadStep({
  onGradingAttemptChange,
  gradingAttempt,
}: UploadStepProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const handleSelectRubric = async (rubric: Rubric | undefined) => {
    if (rubric) {
      const selectors = rubric.criteria.map((criterion) => {
        return { criterion: criterion.name, pattern: "*" };
      });

      try {
        await updateGradingRubric(gradingAttempt.id, rubric.id);
      } catch (error) {
        toast.error("Failed to update rubric");
        console.error("Error updating rubric:", error);
        return;
      }
      try {
        await updateGradingSelectors(gradingAttempt.id, selectors);
      } catch (error) {
        toast.error("Failed to update selectors");
        console.error("Error updating selectors:", error);
        return;
      }

      onGradingAttemptChange({
        rubricId: rubric.id,
        selectors: selectors,
      });
    } else {
      onGradingAttemptChange(undefined);
    }
  };
  const handleFileUpload = async (files: File[]) => {
    const newFiles = files.filter(
      (file) => !uploadedFiles.some((existing) => existing.name === file.name),
    );

    if (newFiles.length > 0) {
      try {
        setProgress(0);
        setIsUploadDialogOpen(true);

        await Promise.all(
          newFiles.map(async (file, index) => {
            try {
              await uploadSubmission(gradingAttempt.id, file);
              const updatedProgress = Math.round(((index + 1) * 100) / newFiles.length);
              setProgress(updatedProgress);
            } catch (error) {
              toast.error(`Failed to upload ${file.name}`);
              console.error("Error uploading file:", error);
            }
          }),
        );

        setUploadedFiles([...uploadedFiles, ...newFiles]);
      } catch (error) {
        console.error("Error uploading files:", error);
      } finally {
        setIsUploadDialogOpen(false);
      }
    }
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
      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Uploading Files</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <Spinner />
            <Progress value={progress} className="w-full" />
            <span className="text-sm text-muted-foreground">{progress}% complete</span>
            <div className="text-sm text-muted-foreground">
              Uploading {uploadedFiles.length + 1} of {uploadedFiles.length + 1} files...
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Select Rubric</h2>
        <div className="flex w-full gap-4">
          <RubricSelect
            gradingAttempt={gradingAttempt}
            onRubricChange={handleSelectRubric}
          />
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
