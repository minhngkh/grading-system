import React from "react";
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
import { Navigate } from "@tanstack/react-router";
import { UseFormReturn } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import {
  updateFeedbackMutationOptions,
  updateScoreMutationOptions,
  rerunAssessmentMutationOptions,
} from "@/queries/assessment-queries";

interface AssessmentHeaderProps {
  form: UseFormReturn<Assessment>;
  assessment: Assessment;
  grading: GradingAttempt;
  rubric: Rubric;
  canRevert: boolean;
  handleRevert: () => void;
  updateLastSavedData: (
    updates: Partial<{
      scoreBreakdowns: Assessment["scoreBreakdowns"];
      feedbacks: Assessment["feedbacks"];
    }>,
  ) => void;
}

export const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  form,
  assessment,
  grading,
  rubric,
  canRevert,
  handleRevert,
  updateLastSavedData,
}) => {
  const [open, setOpen] = React.useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = React.useState(false);

  // Get form data
  const formData = form.watch();

  // Setup mutations
  const queryClient = useQueryClient();
  const auth = useAuth();

  const updateFeedbackMutation = useMutation(
    updateFeedbackMutationOptions(assessment.id, auth, {
      onSuccess: (_, feedbacks) => {
        toast.success("Feedback updated successfully");
        updateLastSavedData({ feedbacks });
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
        updateLastSavedData({
          scoreBreakdowns: scoreBreakdowns as Assessment["scoreBreakdowns"],
        });

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["assessment", assessment.id] });
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

  const rerunAssessmentMutation = useMutation(rerunAssessmentMutationOptions(auth));

  // Save handlers
  const handleSaveFeedback = async () => {
    if (updateFeedbackMutation.isPending) return;
    try {
      await updateFeedbackMutation.mutateAsync(formData.feedbacks);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleSaveScore = async () => {
    if (updateScoreMutation.isPending) return;
    try {
      await updateScoreMutation.mutateAsync(formData.scoreBreakdowns);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleRerunAssessment = async () => {
    if (rerunAssessmentMutation.isPending) return;
    try {
      // Start rerun
      await rerunAssessmentMutation.mutateAsync(assessment.id);

      // Wait a moment for backend to process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refetch assessment data to get updated results
      await queryClient.refetchQueries({
        queryKey: ["assessment", assessment.id],
      });

      // Also invalidate grading attempts list
      queryClient.invalidateQueries({
        queryKey: ["gradingAttempts"],
      });

      toast.success("Assessment rerun completed successfully");
    } catch (error) {
      console.error("Failed to rerun assessment:", error);
      toast.error(
        `Failed to rerun assessment: ${formData.submissionReference}. Please try again.`,
      );
    }
  };

  const isLoading =
    updateFeedbackMutation.isPending ||
    updateScoreMutation.isPending ||
    rerunAssessmentMutation.isPending;

  // Validation logic
  const validationErrors: string[] = [];
  if (!formData.scoreBreakdowns || formData.scoreBreakdowns.length === 0) {
    validationErrors.push("Assessment must have score breakdowns");
  }

  const criteriaNames = rubric.criteria.map((c) => c.name);
  const scoredCriteria = formData.scoreBreakdowns.map((sb) => sb.criterionName);
  const missingCriteria = criteriaNames.filter((name) => !scoredCriteria.includes(name));

  if (missingCriteria.length > 0) {
    validationErrors.push(`Missing scores for criteria: ${missingCriteria.join(", ")}`);
  }

  formData.feedbacks.forEach((feedback, index) => {
    if (!feedback.comment || feedback.comment.trim().length === 0) {
      validationErrors.push(`Feedback ${index + 1} is missing a comment`);
    }
  });

  const handleExport = () => {
    setOpen(true);
  };

  const handleConfirmRevert = () => {
    handleRevert();
    setRevertDialogOpen(false);
  };

  return (
    <div className="p-4 mb-4" style={{ height: "72px" }}>
      <div className="flex items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              Navigate({
                to: "/gradings/$gradingId/result",
                params: { gradingId: grading.id },
              });
            }}
            className="p-2"
            title="Back to results"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              Review Assessment: {formData.submissionReference}
            </h1>
            <p className="text-xs text-muted-foreground">Rubric: {rubric.rubricName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} size="sm">
            <Save className="h-4 w-4 mr-2" />
            <span className="text-xs">Export</span>
          </Button>
          <ExportDialog
            open={open}
            onOpenChange={setOpen}
            exporterClass={AssessmentExporter}
            args={[formData, grading]}
          />

          <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer" size="sm" disabled={!canRevert}>
                <History className="h-4 w-4 mr-2" />
                <span className="text-xs">Revert Changes</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Revert Changes</DialogTitle>
                <DialogDescription>
                  Are you sure you want to revert all changes? This will discard all
                  unsaved feedback and scoring adjustments and restore them to the last
                  saved state.
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
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            <span className="text-xs">Save Feedback</span>
          </Button>
          <Button
            className="cursor-pointer"
            size="sm"
            onClick={handleSaveScore}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            <span className="text-xs">Save Scoring</span>
          </Button>
          <Button
            className="cursor-pointer"
            size="sm"
            onClick={handleRerunAssessment || handleSaveScore}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            <span className="text-xs">Regrade</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
