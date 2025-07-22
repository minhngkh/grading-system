import { useState } from "react";
import { Save, History, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExportDialog } from "@/components/app/export-dialog";
import { AssessmentExporter } from "@/lib/exporters";
import { Assessment, AssessmentState } from "@/types/assessment";
import { GradingAttempt } from "@/types/grading";
import { Rubric } from "@/types/rubric";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import {
  updateFeedbackMutationOptions,
  updateScoreMutationOptions,
  rerunAssessmentMutationOptions,
} from "@/queries/assessment-queries";

interface AssessmentHeaderProps {
  assessment: Assessment;
  lastSavedData: Assessment;
  grading: GradingAttempt;
  rubric: Rubric;
  onUpdate: (updatedAssessment: Partial<Assessment>) => void;
  onUpdateLastSave: (updatedLastSaved: Partial<Assessment>) => void;
}

export const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  assessment,
  lastSavedData,
  grading,
  rubric,
  onUpdate,
  onUpdateLastSave,
}) => {
  const [open, setOpen] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);

  const feedbackChanged =
    JSON.stringify(assessment.feedbacks) !== JSON.stringify(lastSavedData.feedbacks);

  const scoreChanged =
    JSON.stringify(assessment.scoreBreakdowns) !==
    JSON.stringify(lastSavedData.scoreBreakdowns);

  const hasUnsavedChanges = feedbackChanged || scoreChanged;

  const queryClient = useQueryClient();
  const auth = useAuth();

  const updateFeedbackMutation = useMutation(
    updateFeedbackMutationOptions(assessment.id, auth, {
      onSuccess: () => {
        toast.success("Feedback updated successfully");
        onUpdateLastSave({ feedbacks: assessment.feedbacks });
        queryClient.invalidateQueries({ queryKey: ["assessment", assessment.id] });
        queryClient.invalidateQueries({
          queryKey: ["allGradingAssessments", grading.id],
        });
      },
      onError: (error) => {
        console.error("Failed to update feedback:", error);
        toast.error("Failed to update feedback");
      },
    }),
  );

  const updateScoreMutation = useMutation(
    updateScoreMutationOptions(assessment.id, auth, {
      onSuccess: (_, scoreBreakdowns) => {
        toast.success("Score updated successfully");
        onUpdateLastSave({ scoreBreakdowns });

        queryClient.invalidateQueries({ queryKey: ["assessment", assessment.id] });
        queryClient.invalidateQueries({
          queryKey: ["allGradingAssessments", grading.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["scoreAdjustments", assessment.id],
        });
      },
      onError: (error) => {
        onUpdate({ status: AssessmentState.AutoGradingFailed });
        onUpdateLastSave({ status: AssessmentState.AutoGradingFailed });
        console.error("Failed to update score:", error);
        toast.error("Failed to update score");
      },
    }),
  );

  const { mutate: rerunAssessment } = useMutation(
    rerunAssessmentMutationOptions(auth, {
      onMutate: () => {
        onUpdate({ status: AssessmentState.AutoGradingStarted });
        onUpdateLastSave({ status: AssessmentState.AutoGradingStarted });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["assessment", assessment.id] });
        queryClient.invalidateQueries({
          queryKey: ["scoreAdjustments", assessment.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["allGradingAssessments", grading.id],
        });
      },
      onError: (error) => {
        console.error("Failed to rerun assessment:", error);
        toast.error(
          `Failed to rerun assessment: ${assessment.submissionReference}. Please try again.`,
        );
      },
    }),
  );

  const handleSaveFeedback = () => {
    if (updateFeedbackMutation.isPending) return;

    const feedbackChanged =
      JSON.stringify(assessment.feedbacks) !== JSON.stringify(lastSavedData.feedbacks);

    if (!feedbackChanged) {
      toast.info("No feedback changes to save");
      return;
    }

    updateFeedbackMutation.mutate(assessment.feedbacks);
  };

  const handleSaveScore = async () => {
    if (updateScoreMutation.isPending) return;

    const scoreChanged =
      JSON.stringify(assessment.scoreBreakdowns) !==
      JSON.stringify(lastSavedData.scoreBreakdowns);
    if (!scoreChanged) {
      toast.info("No scoring changes to save");
      return;
    }

    try {
      await updateScoreMutation.mutateAsync(assessment.scoreBreakdowns);
    } catch (error) {}
  };

  const isLoading = updateFeedbackMutation.isPending || updateScoreMutation.isPending;

  const handleExport = () => {
    if (hasUnsavedChanges) {
      toast.warning("Please save your changes before exporting the assessment.");
      return;
    }
    setOpen(true);
  };

  const handleConfirmRevert = () => {
    onUpdate(lastSavedData);
    setRevertDialogOpen(false);
    toast.success("Changes reverted to last saved state");
  };

  return (
    <div className="lg:flex items-center justify-between space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="p-2"
          title="Back to results"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">
            Review Assessment: {assessment.submissionReference}
          </h1>
          <p className="text-xs text-muted-foreground">Rubric: {rubric.rubricName}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
          {hasUnsavedChanges && (
            <DialogTrigger asChild>
              <Button disabled={isLoading} size="sm" variant="destructive">
                <History className="h-4 w-4 mr-2" />
                <span className="text-xs">Revert Changes</span>
              </Button>
            </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revert Changes</DialogTitle>
              <DialogDescription>
                Are you sure you want to revert all changes? This will discard all unsaved
                feedback and scoring adjustments and restore them to the last saved state.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRevertDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmRevert}>Revert Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          className="cursor-pointer"
          size="sm"
          onClick={handleSaveFeedback}
          disabled={isLoading || !feedbackChanged}
        >
          <Save className="h-4 w-4 mr-2" />
          <span className="text-xs">Save Feedback</span>
        </Button>
        <Button
          className="cursor-pointer"
          size="sm"
          onClick={handleSaveScore}
          disabled={isLoading || !scoreChanged}
        >
          <Save className="h-4 w-4 mr-2" />
          <span className="text-xs">Save Scoring</span>
        </Button>

        <Button variant="outline" onClick={handleExport} size="sm">
          <Save className="h-4 w-4 mr-2" />
          <span className="text-xs">Export</span>
        </Button>

        <Button
          variant="outline"
          className="cursor-pointer"
          size="sm"
          onClick={() => {
            rerunAssessment(assessment.id);
          }}
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          <span className="text-xs">Regrade</span>
        </Button>

        {open && (
          <ExportDialog
            open={open}
            onOpenChange={setOpen}
            exporterClass={AssessmentExporter}
            args={[assessment, grading]}
          />
        )}
      </div>
    </div>
  );
};
