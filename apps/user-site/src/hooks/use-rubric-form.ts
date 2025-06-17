import { Rubric, RubricSchema } from "@/types/rubric";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

// Custom hook for rubric form logic
const useRubricForm = (rubricData: Rubric) => {
  const [errorsState, setErrorState] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const form = useForm<Rubric>({
    resolver: zodResolver(RubricSchema),
    defaultValues: rubricData,
    mode: "onChange",
  });

  const formData = form.watch();

  // Memoize validation state
  const validationState = useMemo(() => {
    const hasErrors = errorsState.length > 0;
    const totalWeight = formData.criteria.reduce(
      (sum, criterion) => sum + (criterion.weight || 0),
      0,
    );
    const isWeightValid = totalWeight === 100;

    return {
      hasErrors,
      isWeightValid,
      totalWeight,
    };
  }, [errorsState.length, formData]);

  const validateForm = useCallback(async () => {
    setIsValidating(true);
    const result = RubricSchema.safeParse(form.getValues());

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
    form.reset(rubricData);
  }, [form, rubricData]);

  return {
    form,
    formData,
    errorsState,
    setErrorState,
    isValidating,
    validationState,
    validateForm,
    resetForm,
  };
};

export default useRubricForm;
