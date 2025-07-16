import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { FeedbackItem, ScoreBreakdown } from "@/types/assessment";
import {
  updateFeedbackMutationOptions,
  updateScoreMutationOptions,
  rerunAssessmentMutationOptions,
} from "@/queries/assessment-queries";

interface UseAssessmentMutationsProps {
  assessmentId: string;
  gradingId: string;
  onFeedbackUpdate?: (feedbacks: FeedbackItem[]) => void;
  onScoreUpdate?: (scoreBreakdowns: Partial<ScoreBreakdown>[]) => void;
  silentMode?: boolean; // Option to disable toast notifications
}

export function useAssessmentMutations({
  assessmentId,
  gradingId,
  onFeedbackUpdate,
  onScoreUpdate,
  silentMode = false,
}: UseAssessmentMutationsProps) {
  const queryClient = useQueryClient();
  const auth = useAuth();

  const updateFeedbackMutation = useMutation(
    updateFeedbackMutationOptions(assessmentId, auth, {
      onSuccess: (_, feedbacks) => {
        if (!silentMode) {
          toast.success("Feedback updated successfully");
        }
        onFeedbackUpdate?.(feedbacks);

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["assessment", assessmentId] });
        queryClient.invalidateQueries({ queryKey: ["gradingAssessments", gradingId] });
      },
      onError: (error) => {
        console.error("Failed to update feedback:", error);
        if (!silentMode) {
          toast.error("Failed to update feedback");
        }
      },
    }),
  );

  const updateScoreMutation = useMutation(
    updateScoreMutationOptions(assessmentId, auth, {
      onSuccess: (_, scoreBreakdowns) => {
        if (!silentMode) {
          toast.success("Score updated successfully");
        }
        onScoreUpdate?.(scoreBreakdowns);

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["assessment", assessmentId] });
        queryClient.invalidateQueries({ queryKey: ["gradingAssessments", gradingId] });

        // Also trigger score adjustment fetch if needed
        queryClient.invalidateQueries({
          queryKey: ["scoreAdjustments", assessmentId],
        });
      },
      onError: (error) => {
        console.error("Failed to update score:", error);
        if (!silentMode) {
          toast.error("Failed to update score");
        }
      },
    }),
  );

  const rerunAssessmentMutation = useMutation(
    rerunAssessmentMutationOptions(auth, {
      onSuccess: () => {
        toast.success("Assessment rerun started successfully");

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["assessment", assessmentId] });
        queryClient.invalidateQueries({ queryKey: ["assessmentStatus", assessmentId] });
      },
      onError: (error) => {
        console.error("Failed to rerun assessment:", error);
        toast.error("Failed to rerun assessment");
      },
    }),
  );

  return {
    updateFeedback: updateFeedbackMutation,
    updateScore: updateScoreMutation,
    rerunAssessment: rerunAssessmentMutation,
    isLoading:
      updateFeedbackMutation.isPending ||
      updateScoreMutation.isPending ||
      rerunAssessmentMutation.isPending,
  };
}
