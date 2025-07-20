import { useState, useEffect } from "react";
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
import { Assessment } from "@/types/assessment";
import { GradingAttempt } from "@/types/grading";
import { Rubric } from "@/types/rubric";
import { UseMutateFunction, useMutation, useQueryClient } from "@tanstack/react-query";
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
  rerunAssessment?: UseMutateFunction<unknown, unknown, string, unknown>;
  onUpdate: (updatedAssessment: Assessment) => void;
  onUpdateLastSave: (updatedLastSaved: Partial<Assessment>) => void;
}

export const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  assessment,
  lastSavedData,
  grading,
  rubric,
  // rerunAssessment,
  onUpdate,
  onUpdateLastSave,
}) => {
  const [open, setOpen] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [showRevertButton, setShowRevertButton] = useState(false);

  const feedbackChanged =
    JSON.stringify(assessment.feedbacks) !== JSON.stringify(lastSavedData.feedbacks);
  const scoreChanged =
    JSON.stringify(assessment.scoreBreakdowns) !==
    JSON.stringify(lastSavedData.scoreBreakdowns);
  const hasUnsavedChanges = feedbackChanged || scoreChanged;

  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => {
        setShowRevertButton(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShowRevertButton(false);
    }
  }, [hasUnsavedChanges]);

  const queryClient = useQueryClient();
  const auth = useAuth();

  const updateFeedbackMutation = useMutation(
    updateFeedbackMutationOptions(assessment.id, auth, {
      onSuccess: () => {
        toast.success("Feedback updated successfully");
        onUpdateLastSave({ feedbacks: assessment.feedbacks });
        queryClient.invalidateQueries({ queryKey: ["assessment", assessment.id] });
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
        onUpdateLastSave({
          scoreBreakdowns: scoreBreakdowns as Assessment["scoreBreakdowns"],
        });

        queryClient.invalidateQueries({ queryKey: ["assessment", assessment.id] });
        queryClient.invalidateQueries({
          queryKey: ["allGradingAssessments", grading.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["scoreAdjustments", assessment.id],
        });
      },
      onError: (error) => {
        console.error("Failed to update score:", error);
        toast.error("Failed to update score");
      },
    }),
  );

  // const rerunAssessmentMutation = useMutation(rerunAssessmentMutationOptions(auth));
  const { mutate: rerunAssessment } = useMutation(
    rerunAssessmentMutationOptions(auth, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["assessment", assessment.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["scoreAdjustments", assessment.id],
        });
        toast.success("Assessment regrade started successfully");
      },
      onError: (error) => {
        console.error("Failed to rerun assessment:", error);
        toast.error(
          `Failed to rerun assessment: ${assessment.submissionReference}. Please try again.`,
        );
      },
    }),
  );

  const handleSaveFeedback = async () => {
    if (updateFeedbackMutation.isPending) return;

    const feedbackChanged =
      JSON.stringify(assessment.feedbacks) !== JSON.stringify(lastSavedData.feedbacks);
    if (!feedbackChanged) {
      toast.info("No feedback changes to save");
      return;
    }

    try {
      await updateFeedbackMutation.mutateAsync(assessment.feedbacks);
    } catch (error) {}
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
          {showRevertButton && (
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
            console.log("Rerun assessment");
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
