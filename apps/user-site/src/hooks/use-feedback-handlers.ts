import { useCallback } from "react";
import { FeedbackItem } from "@/types/assessment";
import { UseFormReturn } from "react-hook-form";

export function useFeedbackHandlers(
  form: UseFormReturn<any>,
  formData: any,
  generateUID: () => string,
  setSelectedFeedbackId: (id: string | null) => void,
  setSelectedFeedback: (feedback: FeedbackItem | null) => void,
) {
  const isFeedbackForFile = useCallback((fb: FeedbackItem, file: any) => {
    try {
      if (fb.fileRef && file.relativePath && fb.fileRef.endsWith(file.relativePath))
        return true;
    } catch {}
    return false;
  }, []);

  const handleUpdateFeedback = useCallback(
    (index: number, updatedFeedback: Partial<FeedbackItem>) => {
      const currentFeedbacks = [...formData.feedbacks];
      if (index >= 0 && index < currentFeedbacks.length) {
        currentFeedbacks[index] = {
          ...currentFeedbacks[index],
          ...updatedFeedback,
        };
        form.setValue("feedbacks", currentFeedbacks, { shouldValidate: true });
        return true;
      }
      return false;
    },
    [formData.feedbacks, form],
  );

  const handleAddNewFeedback = useCallback(
    (newFeedback: FeedbackItem) => {
      newFeedback.id = generateUID();
      const currentFeedbacks = [...formData.feedbacks];
      currentFeedbacks.push(newFeedback);

      form.setValue("feedbacks", currentFeedbacks, { shouldValidate: true });
      setSelectedFeedbackId(newFeedback.id ?? null);
      setSelectedFeedback(newFeedback);

      return newFeedback.id;
    },
    [formData.feedbacks, form, generateUID, setSelectedFeedbackId, setSelectedFeedback],
  );

  const handleDeleteFeedback = useCallback(
    (feedbackId: string) => {
      const current = formData.feedbacks;
      const updated = current.filter((f: FeedbackItem) => f.id !== feedbackId);
      form.setValue("feedbacks", updated, { shouldValidate: true });
    },
    [formData.feedbacks, form],
  );

  return {
    isFeedbackForFile,
    handleUpdateFeedback,
    handleAddNewFeedback,
    handleDeleteFeedback,
  };
}
