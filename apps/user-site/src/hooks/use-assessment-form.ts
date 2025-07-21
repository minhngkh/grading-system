import { Assessment, AssessmentSchema } from "@/types/assessment";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";

const useAssessmentForm = (assessmentData: Assessment) => {
  const [errorsState, setErrorState] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const form = useForm<Assessment>({
    resolver: zodResolver(AssessmentSchema),
    defaultValues: assessmentData,
    values: assessmentData,
    mode: "onChange",
  });

  const formData = form.watch();

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

  return {
    form,
    formData,
    errorsState,
    setErrorState,
    isValidating,
    validateForm,
  };
};

export default useAssessmentForm;
