import type { Rubric } from "@/types/rubric";
import { Button } from "@/components/ui/button";
import { FileList } from "./file-list";
import { RubricSelect } from "@/components/app/scrollable-select";
import { GradingAttempt, Submission } from "@/types/grading";
import CriteriaMapper from "./criteria-mapping";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GradingService } from "@/services/grading-service";
import { Spinner } from "@/components/app/spinner";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InfoToolTip } from "@/components/app/info-tooltip";
import { useDebounce } from "@/hooks/use-debounce";
import { FileUploader } from "@/components/app/file-uploader";
import { useAuth } from "@clerk/clerk-react";

interface UploadStepProps {
  onGradingAttemptChange: (gradingAttempt?: Partial<GradingAttempt>) => Promise<void>;
  gradingAttempt: GradingAttempt;
}

export default function UploadStep({
  onGradingAttemptChange,
  gradingAttempt,
}: UploadStepProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [scaleFactor, setScaleFactor] = useState<number | undefined>(
    gradingAttempt.scaleFactor,
  );
  const auth = useAuth();

  const debounceScaleFactor = useDebounce(scaleFactor, 500);

  useEffect(() => {
    if (debounceScaleFactor !== undefined) {
      onGradingAttemptChange({ scaleFactor: debounceScaleFactor });
    }
  }, [debounceScaleFactor]);

  const handleSelectRubric = async (rubric: Rubric | undefined) => {
    if (!rubric) {
      return;
    }

    const selectors = rubric.criteria.map((criterion) => {
      return { criterion: criterion.name, pattern: "*" };
    });

    await onGradingAttemptChange({
      rubricId: rubric.id,
      selectors: selectors,
    });
  };

  const handleFileUpload = async (files: File[]) => {
    const newFiles = files.filter(
      (file) => !uploadedFiles.some((existing) => existing.name === file.name),
    );

    if (newFiles.length > 0) {
      try {
        const token = await auth.getToken();
        if (!token) {
          throw new Error("Unauthorized: No token found");
        }

        setProgress(0);
        setIsUploadDialogOpen(true);

        await Promise.all(
          newFiles.map(async (file, index) => {
            try {
              await GradingService.uploadSubmission(gradingAttempt.id, file, token);
              const updatedProgress = Math.round(((index + 1) * 100) / newFiles.length);
              setProgress(updatedProgress);
            } catch (error) {
              toast.error(`Failed to upload ${file.name}`);
              console.error("Error uploading file:", error);
            }
          }),
        );

        const updatedFiles = [...uploadedFiles, ...newFiles];

        onGradingAttemptChange({
          submissions: [
            ...gradingAttempt.submissions,
            ...updatedFiles.map((file) => {
              return {
                reference: file.name.replace(/\.[^/.]+$/, ""),
              };
            }),
          ],
        });

        setUploadedFiles(updatedFiles);
      } catch (error) {
        console.error("Error uploading files:", error);
      } finally {
        setIsUploadDialogOpen(false);
      }
    }
  };

  const handleRemoveSubmission = async (submission: Submission) => {
    try {
      const updatedFiles = uploadedFiles.filter((file) => {
        return file.name !== `${submission.reference}.zip`;
      });
      setUploadedFiles(updatedFiles);

      await onGradingAttemptChange({
        submissions: gradingAttempt.submissions.filter(
          (sub) => sub.reference !== submission.reference,
        ),
      });

      const token = await auth.getToken();
      if (!token) {
        throw new Error("Unauthorized: No token found");
      }

      await GradingService.deleteSubmission(
        gradingAttempt.id,
        submission.reference,
        token,
      );
    } catch (error) {
      console.error("Error removing submission:", error);
      toast.error(`Failed to remove submission: ${submission.reference}`);
    }
  };

  const handleRemoveAllSubmissions = async () => {
    try {
      setUploadedFiles([]);
      await onGradingAttemptChange({ submissions: [] });

      const token = await auth.getToken();
      if (!token) {
        throw new Error("Unauthorized: No token found");
      }

      await Promise.all(
        gradingAttempt.submissions.map((submission) =>
          GradingService.deleteSubmission(gradingAttempt.id, submission.reference, token),
        ),
      );
    } catch (error) {
      console.error("Error removing all submissions:", error);
      toast.error("Failed to remove all submissions");
    }
  };

  return (
    <div className="size-full space-y-4">
      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
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

      <div className="space-y-1">
        <div className="flex items-center space-x-1">
          <h2 className="text-lg font-semibold">Select Rubric</h2>
          <InfoToolTip description="Choose a rubric to use for grading. If you don't have a rubric, you can create one." />
        </div>
        <div className="flex items-center w-full gap-4">
          <RubricSelect
            gradingAttempt={gradingAttempt}
            onRubricChange={handleSelectRubric}
          />
          <span>or</span>
          <Button variant="outline" asChild>
            <Link preload={false} to="/rubrics/create">
              Create New Rubric
            </Link>
          </Button>
          {gradingAttempt.rubricId && (
            <Button asChild>
              <Link
                to="/rubrics/$id"
                params={{ id: gradingAttempt.rubricId }}
                search={{ redirect: location.pathname }}
              >
                Edit Rubric
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center space-x-1">
          <h2 className="text-lg font-semibold">Grade Scale</h2>
          <InfoToolTip description="Adjust the grade scale for grading. This will affect the overall grading score of each submission." />
        </div>
        <Input
          className="max-w-32"
          type="number"
          min={1}
          value={scaleFactor}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) setScaleFactor(value);
            else setScaleFactor(10);
          }}
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center space-x-1">
          <h2 className="text-lg font-semibold">Upload Files</h2>
          <InfoToolTip description="Choose files to upload for grading. Only .zip files are accepted." />
        </div>
        <FileUploader onFileUpload={handleFileUpload} accept=".zip" multiple />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Uploaded Files</h2>
          {gradingAttempt.submissions.length > 0 && (
            <Button
              onClick={handleRemoveAllSubmissions}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              Remove All
            </Button>
          )}
        </div>
        <FileList gradingAttempt={gradingAttempt} onDelete={handleRemoveSubmission} />
        {gradingAttempt.submissions.length > 0 && (
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
