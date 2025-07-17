import { Assessment, AssessmentSchema } from "@/types/assessment";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

// Custom hook for assessment form logic following rubric form pattern
const useAssessmentForm = (assessmentData: Assessment) => {
  const [errorsState, setErrorState] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [lastSavedData, setLastSavedData] = useState({
    feedbacks: assessmentData.feedbacks,
    scoreBreakdowns: assessmentData.scoreBreakdowns,
  });

  const form = useForm<Assessment>({
    resolver: zodResolver(AssessmentSchema),
    defaultValues: assessmentData,
    mode: "onChange",
  });

  const formData = form.watch();

  // Memoize validation state
  const validationState = useMemo(() => {
    const hasErrors = errorsState.length > 0;
    const totalScore = formData.scoreBreakdowns.reduce(
      (sum, sb) => sum + (sb.rawScore || 0),
      0,
    );

    // Calculate canRevert
    const canRevert = 
      JSON.stringify(formData.feedbacks) !== JSON.stringify(lastSavedData.feedbacks) ||
      JSON.stringify(formData.scoreBreakdowns) !== JSON.stringify(lastSavedData.scoreBreakdowns);

    const hasUnsavedChanges = canRevert;

    return {
      hasErrors,
      canRevert,
      hasUnsavedChanges,
      totalScore,
    };
  }, [errorsState.length, formData, lastSavedData]);

  const validateForm = useCallback(async () => {
    setIsValidating(true);
    const result = AssessmentSchema.safeParse(form.getValues());

    if (!result.success) {
      const errors: Set<string> = new Set();
      result.error.errors.forEach((error) => {
        errors.add(error.message);
      });
      setErrorState(Array.from(errors));
      setIsValidating(false);
      return false;
    }

    setErrorState([]);
    setIsValidating(false);
    return true;
  }, [form]);

  const resetForm = useCallback(() => {
    setErrorState([]);
    form.reset(assessmentData);
    setLastSavedData({
      feedbacks: assessmentData.feedbacks,
      scoreBreakdowns: assessmentData.scoreBreakdowns,
    });
  }, [form, assessmentData]);

  const revertToLastSaved = useCallback(() => {
    form.setValue("feedbacks", lastSavedData.feedbacks);
    form.setValue("scoreBreakdowns", lastSavedData.scoreBreakdowns);
  }, [form, lastSavedData]);

  const updateLastSavedData = useCallback((updates: Partial<{
    feedbacks: Assessment["feedbacks"];
    scoreBreakdowns: Assessment["scoreBreakdowns"];
  }>) => {
    setLastSavedData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    form,
    formData,
    errorsState,
    setErrorState,
    isValidating,
    validationState,
    validateForm,
    resetForm,
    lastSavedData,
    setLastSavedData,
    updateLastSavedData,
    revertToLastSaved,
  };
};

export default useAssessmentForm;
