import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import equal from "fast-deep-equal";
import { Assessment } from "@/types/assessment";

export function useAssessmentState(assessment: Assessment) {
  const form = useForm<Assessment>({
    defaultValues: assessment,
    mode: "onChange" as const,
  });

  const formData = form.watch();
  
  // Keep track of the original assessment data (never changes)
  const [originalData] = useState<{
    scoreBreakdowns: Assessment["scoreBreakdowns"];
    feedbacks: Assessment["feedbacks"];
  }>({
    scoreBreakdowns: assessment.scoreBreakdowns,
    feedbacks: assessment.feedbacks,
  });

  const [lastSavedData, setLastSavedData] = useState<{
    scoreBreakdowns: Assessment["scoreBreakdowns"];
    feedbacks: Assessment["feedbacks"];
  } | null>(null);

  // Initialize data on mount or when assessment changes
  useEffect(() => {
    const initialState = {
      scoreBreakdowns: assessment.scoreBreakdowns,
      feedbacks: assessment.feedbacks,
    };
    setLastSavedData(initialState);
    
    // Reset form with new assessment data
    form.reset(assessment);
  }, [assessment.id]); // Only re-initialize when assessment ID changes

  // Memoize calculated states for performance
  const calculatedStates = useMemo(() => {
    const isDirty =
      lastSavedData !== null &&
      (!equal(formData.scoreBreakdowns, lastSavedData.scoreBreakdowns) ||
        !equal(formData.feedbacks, lastSavedData.feedbacks));

    // canRevert compares with ORIGINAL data, not lastSaved data
    const canRevert =
      !equal(formData.scoreBreakdowns, originalData.scoreBreakdowns) ||
      !equal(formData.feedbacks, originalData.feedbacks);

    const hasUnsavedChanges = isDirty;

    // Calculate total score from score breakdowns
    const totalScore = formData.scoreBreakdowns.reduce(
      (sum, sb) => sum + (sb.rawScore || 0),
      0,
    );

    return {
      isDirty,
      canRevert,
      hasUnsavedChanges,
      totalScore,
    };
  }, [formData.scoreBreakdowns, formData.feedbacks, lastSavedData, originalData]);

  // UID generator
  const generateUID = useCallback(() => {
    const first = (Math.random() * 46656) | 0;
    const second = (Math.random() * 46656) | 0;
    const part1 = ("000" + first.toString(36)).slice(-3);
    const part2 = ("000" + second.toString(36)).slice(-3);
    return (part1 + part2).toUpperCase();
  }, []);

  // Helper functions for updating state
  const updateLastSavedData = useCallback((updates: Partial<{
    scoreBreakdowns: Assessment["scoreBreakdowns"];
    feedbacks: Assessment["feedbacks"];
  }>) => {
    setLastSavedData(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Note: We removed updateInitialData since we now use originalData which never changes
  // This was the source of the bug - markCurrentAsInitial was resetting initialData

  // Mark current state as "saved" (after successful save)
  const markCurrentAsSaved = useCallback(() => {
    const currentState = {
      scoreBreakdowns: formData.scoreBreakdowns,
      feedbacks: formData.feedbacks,
    };
    setLastSavedData(currentState);
  }, [formData.scoreBreakdowns, formData.feedbacks]);

  // Mark current state as validated (after validation updates) - this resets isDirty to false
  // This should be called ONLY when we're sure no more validation updates will occur
  const markCurrentAsValidated = useCallback(() => {
    setLastSavedData({
      scoreBreakdowns: [...formData.scoreBreakdowns],
      feedbacks: [...formData.feedbacks],
    });
  }, [formData.scoreBreakdowns, formData.feedbacks]);

  // Reset to original state (the revert functionality)
  const resetToInitial = useCallback(() => {
    form.setValue("scoreBreakdowns", originalData.scoreBreakdowns);
    form.setValue("feedbacks", originalData.feedbacks);
  }, [form, originalData]);

  // Reset to last saved state
  const resetToLastSaved = useCallback(() => {
    if (!lastSavedData) return;
    form.setValue("scoreBreakdowns", lastSavedData.scoreBreakdowns);
    form.setValue("feedbacks", lastSavedData.feedbacks);
  }, [form, lastSavedData]);

  return {
    form,
    formData,
    originalData,
    lastSavedData,
    setLastSavedData,
    updateLastSavedData,
    markCurrentAsSaved,
    markCurrentAsValidated,
    generateUID,
    resetToInitial,
    resetToLastSaved,
    ...calculatedStates,
  };
}
