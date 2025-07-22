import type { UseFormReturn } from "react-hook-form";
import type { CriteriaSelector, GradingAttempt, Submission } from "@/types/grading";
import { RubricStatus, type Rubric } from "@/types/rubric";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileUploader } from "@/components/app/file-uploader";
import { InfoToolTip } from "@/components/app/info-tooltip";
import { ScrollableSelectMemo } from "@/components/app/scrollable-select";
import { Spinner } from "@/components/app/spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounceUpdate } from "@/hooks/use-debounce";
import CriteriaMapper from "./criteria-mapping";
import { FileList } from "./file-list";
import {
  getInfiniteRubricsQueryOptions,
  getRubricQueryOptions,
} from "@/queries/rubric-queries";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteSubmissionMutationOptions,
  updateGradingNameMutationOptions,
  updateGradingRubricMutationOptions,
  updateGradingScaleFactorMutationOptions,
  updateGradingSelectorsMutationOptions,
  uploadSubmissionMutationOptions,
} from "@/queries/grading-queries";
import { ViewRubricDialog } from "@/components/app/view-rubric-dialog";
import { Eye, Pencil, Plus } from "lucide-react";

interface UploadStepProps {
  form: UseFormReturn<GradingAttempt>;
}

export default function UploadStep({ form }: UploadStepProps) {
  const auth = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isFileDialogOpen, setFileDialogOpen] = useState(false);
  const [fileDialogAction, setFileDialogAction] = useState("");
  const [viewRubricDialogOpen, setViewRubricDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    setValue,
    setFocus,
    formState: { errors },
  } = form;

  const gradingAttempt = form.watch();

  const { data: rubricData } = useQuery(
    getRubricQueryOptions(gradingAttempt.rubricId, auth, {
      placeholderData: keepPreviousData,
    }),
  );

  useEffect(() => {
    if (!rubricData) return;

    if (gradingAttempt.selectors.length !== rubricData?.criteria.length) {
      const selectors = rubricData.criteria.map((criterion) => ({
        criterion: criterion.name,
        pattern: "*",
      }));
      handleSelectorsChange(selectors);
    }
  }, [rubricData]);

  useEffect(() => {
    const fields = Object.keys(errors);
    if (fields.length > 0) {
      setFocus(fields[0] as any);
    }
  }, [errors]);

  const updateNameMutation = useMutation(
    updateGradingNameMutationOptions(gradingAttempt.id, auth, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["gradingAttempt", gradingAttempt.id],
        });
      },
    }),
  );

  const updateScaleFactorMutation = useMutation(
    updateGradingScaleFactorMutationOptions(gradingAttempt.id, auth, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["gradingAttempt", gradingAttempt.id],
        });
      },
    }),
  );

  const updateRubricMutation = useMutation(
    updateGradingRubricMutationOptions(gradingAttempt.id, auth, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["gradingAttempt", gradingAttempt.id],
        });
      },
    }),
  );

  const updateSelectorsMutation = useMutation(
    updateGradingSelectorsMutationOptions(gradingAttempt.id, auth, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["gradingAttempt", gradingAttempt.id],
        });
      },
    }),
  );

  const uploadFileMutation = useMutation(
    uploadSubmissionMutationOptions(gradingAttempt.id, auth, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["gradingAttempt", gradingAttempt.id],
        });
      },
    }),
  );

  const removeFileMutation = useMutation(
    deleteSubmissionMutationOptions(gradingAttempt.id, auth, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["gradingAttempt", gradingAttempt.id],
        });
      },
    }),
  );

  const handleScaleFactorUpdate = useCallback(
    (scaleFactor: number | undefined) => {
      if (scaleFactor == undefined) return;

      updateScaleFactorMutation.mutate(scaleFactor);
    },
    [updateScaleFactorMutation, gradingAttempt.id],
  );

  useDebounceUpdate(gradingAttempt.name, 500, updateNameMutation.mutate);
  useDebounceUpdate(gradingAttempt.scaleFactor, 500, handleScaleFactorUpdate);

  const handleSelectorsChange = async (selectors: CriteriaSelector[]) => {
    await updateSelectorsMutation.mutateAsync(selectors);
    setValue("selectors", selectors);
  };

  const handleSelectRubric = async (rubric: Rubric) => {
    if (gradingAttempt.rubricId === rubric.id) return;

    await updateRubricMutation.mutateAsync(rubric.id);
    setValue("rubricId", rubric.id);
  };

  const handleFileUpload = async (files: File[]) => {
    if (isUploading) return;
    setIsUploading(true);

    const newFiles = files.filter(
      (file) => !uploadedFiles.some((existing) => existing.name === file.name),
    );

    if (newFiles.length == 0) return;

    setFileDialogAction("Uploading");
    setFileDialogOpen(true);

    try {
      const allUploadRefs = await uploadFileMutation.mutateAsync(newFiles);

      const newSubmissions = [
        ...gradingAttempt.submissions,
        ...allUploadRefs.map((ref) => {
          return {
            reference: ref,
          };
        }),
      ];

      setValue("submissions", newSubmissions);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload some files");
    } finally {
      setIsUploading(false);
      setFileDialogOpen(false);
    }
  };

  const handleRemoveSubmission = async (submission: Submission) => {
    try {
      await removeFileMutation.mutateAsync(submission.reference);

      const updatedFiles = uploadedFiles.filter((file) => {
        return file.name !== `${submission.reference}.zip`;
      });

      setUploadedFiles(updatedFiles);
      setValue(
        "submissions",
        gradingAttempt.submissions.filter(
          (sub) => sub.reference !== submission.reference,
        ),
      );
    } catch (error) {
      console.error("Error removing submission:", error);
      toast.error(`Failed to remove submission: ${submission.reference}`);
    }
  };

  const handleRemoveAllSubmissions = async () => {
    setFileDialogAction("Removing");
    setFileDialogOpen(true);

    await Promise.all(
      form.getValues("submissions").map(async (submission: Submission) => {
        await handleRemoveSubmission(submission);
      }),
    );

    setUploadedFiles([]);
    setValue("submissions", []);
    setFileDialogOpen(false);
  };

  return (
    <div className="size-full space-y-4">
      <ViewRubricDialog
        initialRubric={rubricData}
        open={viewRubricDialogOpen}
        onOpenChange={setViewRubricDialogOpen}
      />
      {/* Upload Dialog */}
      <Dialog open={isFileDialogOpen} onOpenChange={setFileDialogOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{fileDialogAction} Files</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <Spinner />
            <span className="text-sm text-muted-foreground">Please wait...</span>
          </div>
        </DialogContent>
      </Dialog>

      <div>
        <h1 className="text-3xl font-semibold">Grade Assignments</h1>
        <p className="text-muted-foreground">
          Upload files for grading and configure the grading settings.
        </p>
      </div>
      <div className="space-y-1">
        <Label className="text-lg">Name</Label>
        <Input
          defaultValue={gradingAttempt.name}
          {...register("name")}
          className="max-w-md"
          placeholder="Enter session name"
        />
        {errors.name?.message && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center space-x-1">
          <Label className="text-lg">Select Rubric</Label>
          <InfoToolTip description="Choose a rubric to use for grading. If you don't have a rubric, you can create one." />
        </div>
        <div className="flex items-center w-full gap-2">
          <ScrollableSelectMemo<Rubric>
            value={rubricData}
            onValueChange={handleSelectRubric}
            queryOptionsFn={getInfiniteRubricsQueryOptions(auth, {
              status: RubricStatus.Draft,
            })}
            placeholder="Select a rubric"
            selectFn={(rubric) => rubric.rubricName}
          />
          <span>or</span>
          <Button asChild>
            <Link preload={false} to="/rubrics/create">
              <Plus className="h-4 w-4" />
              New Rubric
            </Link>
          </Button>
          {gradingAttempt.rubricId && (
            <>
              <Button variant="outline" asChild>
                <Link
                  to="/rubrics/$id"
                  params={{ id: gradingAttempt.rubricId }}
                  search={{ redirect: location.pathname }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Rubric
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setViewRubricDialogOpen(true)}>
                <Eye className="h-4 w-4" />
                View Rubric
              </Button>
            </>
          )}
          {errors.rubricId?.message && (
            <p className="text-sm text-destructive">{errors.rubricId.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center space-x-1">
          <Label className="text-lg">Grade Scale</Label>
          <InfoToolTip description="Set a grade scale for the assignment. This will determine how grades are calculated and displayed." />
        </div>
        <Input
          className="w-24"
          type="number"
          min={1}
          defaultValue={gradingAttempt.scaleFactor ?? 10}
          {...register("scaleFactor", { valueAsNumber: true, min: 1 })}
        />
        {errors.scaleFactor?.message && (
          <p className="text-sm text-destructive">{errors.scaleFactor.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center space-x-1">
          <div className="flex justify-between items-center w-full">
            <Label className="text-lg font-semibold">Upload Files</Label>
            <InfoToolTip description="Choose files to upload for grading. Only .zip files are accepted." />
          </div>
        </div>
        <FileUploader
          onFileUpload={handleFileUpload}
          multiple
          maxSize={20} // 20 MB
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-semibold">Uploaded Files</Label>
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
        {errors.submissions?.message && (
          <p className="text-sm text-destructive">{errors.submissions.message}</p>
        )}
        {gradingAttempt.submissions.length > 0 && (
          <CriteriaMapper
            gradingAttempt={gradingAttempt}
            onSelectorsChange={handleSelectorsChange}
            uploadedFiles={uploadedFiles}
          />
        )}
        {errors.selectors?.message && (
          <p className="text-sm text-destructive">{errors.selectors.message}</p>
        )}
      </div>
    </div>
  );
}
