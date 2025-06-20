import type { Rubric } from "@/types/rubric";
import { Button } from "@/components/ui/button";
import { FileList } from "./file-list";
import { ScrollableSelectMemo } from "@/components/app/scrollable-select";
import { CriteriaSelector, GradingAttempt, Submission } from "@/types/grading";
import CriteriaMapper from "./criteria-mapping";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
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
import { RubricService } from "@/services/rubric-service";

interface UploadStepProps {
  onGradingAttemptChange: (gradingAttempt: Partial<GradingAttempt>) => void;
  gradingAttempt: GradingAttempt;
}

export default function UploadStep({
  onGradingAttemptChange,
  gradingAttempt,
}: UploadStepProps) {
  const auth = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [isFileDialogOpen, setFileDialogOpen] = useState(false);
  const [fileDialogAction, setFileDialogAction] = useState("");
  const [scaleFactor, setScaleFactor] = useState<number>(
    gradingAttempt.scaleFactor ?? 10,
  );

  const debounceScaleFactor = useDebounce(scaleFactor, 500);

  const handleScaleFactorChange = useCallback(
    async (value: number) => {
      const token = await auth.getToken();
      if (!token) {
        console.error("Error updating scale factor: No token found");
        return toast.error("Unauthorized: You must be logged in to update scale factor");
      }

      try {
        await GradingService.updateGradingScaleFactor(gradingAttempt.id, value, token);
        onGradingAttemptChange({ scaleFactor: value });
      } catch (error) {
        console.error("Error updating scale factor:", error);
        toast.error("Failed to update scale factor");
      }
    },
    [auth, gradingAttempt.id, onGradingAttemptChange],
  );

  useEffect(() => {
    if (debounceScaleFactor != undefined) {
      handleScaleFactorChange(debounceScaleFactor);
    }
  }, [debounceScaleFactor]);

  const handleSelectorsChange = async (selectors: CriteriaSelector[]) => {
    const token = await auth.getToken();
    if (!token) {
      console.error("Error updating rubric: No token found");
      toast.error("Unauthorized: You must be logged in to update rubric");
      return;
    }

    try {
      await GradingService.updateGradingSelectors(gradingAttempt.id, selectors, token);
      onGradingAttemptChange({
        selectors: selectors,
      });
    } catch (error) {
      console.error("Error generating selectors:", error);
      toast.error("Failed to update selectors");
    }
  };

  const handleSelectRubric = async (rubric: Rubric) => {
    if (gradingAttempt.rubricId != undefined && gradingAttempt.rubricId === rubric.id)
      return;

    const token = await auth.getToken();
    if (!token) {
      console.error("Error updating rubric: No token found");
      toast.error("Unauthorized: You must be logged in to update rubric");
      return;
    }

    try {
      await GradingService.updateGradingRubric(gradingAttempt.id, rubric.id, token);
      onGradingAttemptChange({
        rubricId: rubric.id,
      });
    } catch (error) {
      console.error("Error updating rubric:", error);
      toast.error("Failed to select rubric");
      return;
    }

    const selectors = rubric.criteria.map((criterion) => {
      return { criterion: criterion.name, pattern: "*" };
    });

    handleSelectorsChange(selectors);
  };

  const handleFileUpload = async (files: File[]) => {
    const token = await auth.getToken();
    if (!token) {
      console.error("Error updating rubric: No token found");
      return toast.error("Unauthorized: You must be logged in to update rubric");
    }

    const newFiles = files.filter(
      (file) => !uploadedFiles.some((existing) => existing.name === file.name),
    );

    if (newFiles.length > 0) {
      setFileDialogAction("Uploading");
      setProgress(0);
      setFileDialogOpen(true);

      await Promise.all(
        newFiles.map(async (file, index) => {
          try {
            await GradingService.uploadSubmission(gradingAttempt.id, file, token);
            const updatedFiles = [...uploadedFiles, file];
            setUploadedFiles(updatedFiles);
          } catch (error) {
            toast.error(`Failed to upload ${file.name}`);
            console.error("Error uploading file:", error);
          } finally {
            const updatedProgress = Math.round(((index + 1) * 100) / newFiles.length);
            setProgress(updatedProgress);
          }
        }),
      );

      const newSubmissions = [
        ...gradingAttempt.submissions,
        ...newFiles.map((file) => {
          return {
            reference: file.name.replace(/\.[^/.]+$/, ""),
          };
        }),
      ];

      onGradingAttemptChange({
        submissions: newSubmissions,
      });

      setFileDialogOpen(false);
    }
  };

  const handleRemoveSubmission = async (
    submission: Submission,
    token?: string | null,
  ) => {
    if (!token) {
      token = await auth.getToken();
    }

    if (!token) {
      console.error("Error updating rubric: No token found");
      return toast.error("Unauthorized: You must be logged in to update rubric");
    }

    try {
      await GradingService.deleteSubmission(
        gradingAttempt.id,
        submission.reference,
        token,
      );

      const updatedFiles = uploadedFiles.filter((file) => {
        return file.name !== `${submission.reference}.zip`;
      });

      setUploadedFiles(updatedFiles);
      onGradingAttemptChange({
        submissions: gradingAttempt.submissions.filter(
          (sub) => sub.reference !== submission.reference,
        ),
      });
    } catch (error) {
      console.error("Error removing submission:", error);
      toast.error(`Failed to remove submission: ${submission.reference}`);
    }
  };

  const handleRemoveAllSubmissions = async () => {
    const token = await auth.getToken();
    if (!token) {
      console.error("Error updating rubric: No token found");
      return toast.error("Unauthorized: You must be logged in to update rubric");
    }

    setFileDialogAction("Removing");
    setProgress(0);
    setFileDialogOpen(true);

    await Promise.all(
      gradingAttempt.submissions.map(async (submission, index) => {
        await handleRemoveSubmission(submission, token);
        const updatedProgress = Math.round(
          ((index + 1) * 100) / gradingAttempt.submissions.length,
        );
        setProgress(updatedProgress);
      }),
    );

    setFileDialogOpen(false);
  };

  return (
    <div className="size-full space-y-4">
      {/* Upload Dialog */}
      <Dialog open={isFileDialogOpen} onOpenChange={setFileDialogOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{fileDialogAction} Files</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <Spinner />
            <Progress value={progress} className="w-full" />
            <span className="text-sm text-muted-foreground">{progress}% complete</span>
            <div className="text-sm text-muted-foreground">
              {fileDialogAction} {uploadedFiles.length + 1} of {uploadedFiles.length + 1}{" "}
              files...
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
          <ScrollableSelectMemo<Rubric>
            value={gradingAttempt.rubricId}
            onValueChange={handleSelectRubric}
            searchFn={(params, token) => RubricService.getRubrics(params, token)}
            selectFn={(rubric) => rubric.rubricName}
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
          name="scaleFactor"
          className="max-w-32"
          type="number"
          min={1}
          value={scaleFactor}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
              setScaleFactor(value);
            } else {
              setScaleFactor(10);
            }
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
            onSelectorsChange={handleSelectorsChange}
            uploadedFiles={uploadedFiles}
          />
        )}
      </div>
    </div>
  );
}
