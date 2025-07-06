import type { Criteria, Level, Rubric } from "@/types/rubric";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle, PlusCircle, Trash2, Save, X } from "lucide-react";
import { useCallback, useMemo, useEffect, memo } from "react";
import useRubricForm from "@/hooks/use-rubric-form";

interface EditRubricProps {
  rubricData: Rubric;
  onUpdate?: (rubric: Partial<Rubric>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
}

const EditRubric = memo(function EditRubric({
  rubricData,
  onUpdate,
  open,
  onOpenChange,
  isLoading = false,
}: EditRubricProps) {
  const {
    form,
    formData,
    errorsState,
    isValidating,
    validationState,
    validateForm,
    resetForm,
  } = useRubricForm(rubricData);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          handleSave();
        } else if (e.key === "Escape") {
          e.preventDefault();
          onOpenChange?.(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Optimized event handlers with useCallback
  const handleCriterionChange = useCallback(
    (
      index: number,
      field: keyof (typeof rubricData.criteria)[0],
      value: string | number,
    ) => {
      const newCriteria = [...formData.criteria];
      newCriteria[index] = { ...newCriteria[index], [field]: value };
      form.setValue("criteria", newCriteria, { shouldValidate: true });
    },
    [formData.criteria, form],
  );

  const handleLevelDescriptionChange = useCallback(
    (criterionIndex: number, tagIndex: number, value: string) => {
      const newCriteria = [...formData.criteria];
      const performanceTag = formData.tags[tagIndex];

      const levelIndex = newCriteria[criterionIndex].levels.findIndex(
        (level) => level.tag === performanceTag,
      );

      if (value.length === 0) {
        if (levelIndex !== -1) {
          newCriteria[criterionIndex].levels.splice(levelIndex, 1);
        }
      } else {
        if (levelIndex === -1) {
          const newLevel: Level = {
            description: value,
            weight: 0,
            tag: performanceTag,
          };
          newCriteria[criterionIndex].levels.push(newLevel);
        } else {
          newCriteria[criterionIndex].levels[levelIndex].description = value;
        }
      }

      form.setValue("criteria", newCriteria, { shouldValidate: true });
    },
    [formData.criteria, formData.tags, form],
  );

  const handleLevelWeightChange = useCallback(
    (criterionIndex: number, tagIndex: number, points: number) => {
      const newCriteria = [...formData.criteria];
      const performanceTag = formData.tags[tagIndex];

      const levelIndex = newCriteria[criterionIndex].levels.findIndex(
        (level) => level.tag === performanceTag,
      );

      if (levelIndex !== -1) {
        newCriteria[criterionIndex].levels[levelIndex].weight = points;
        form.setValue("criteria", newCriteria, { shouldValidate: true });
      }
    },
    [formData.criteria, formData.tags, form],
  );

  const handleSave = useCallback(async () => {
    const isValid = await validateForm();
    if (isValid) {
      onUpdate?.(formData);
      onOpenChange?.(false);
    }
  }, [validateForm, onUpdate, formData]);

  const handleAddLevel = useCallback(() => {
    if (formData.tags.length >= 6) return;

    const newHeaders = [...formData.tags, `Level ${formData.tags.length + 1}`];
    form.setValue("tags", newHeaders, { shouldValidate: true });
  }, [formData.tags, form]);

  const handleAddCriterion = useCallback(() => {
    const newCriteria: Criteria[] = [
      ...formData.criteria,
      {
        name: `Criterion ${formData.criteria.length + 1}`,
        weight: 0,
        levels: [],
      },
    ];
    form.setValue("criteria", newCriteria, { shouldValidate: true });
  }, [formData.criteria, form]);

  const handleDeleteLevel = useCallback(
    (indexToDelete: number) => {
      const newHeaders = formData.tags.filter((_, index) => index !== indexToDelete);
      const newCriteria = formData.criteria.map((criterion) => ({
        ...criterion,
        levels: criterion.levels.filter(
          (level) => level.tag !== formData.tags[indexToDelete],
        ),
      }));

      form.setValue("tags", newHeaders, { shouldValidate: true });
      form.setValue("criteria", newCriteria, { shouldValidate: true });
    },
    [formData.tags, formData.criteria, form],
  );

  const handleDeleteCriterion = useCallback(
    (indexToDelete: number) => {
      const newCriteria = formData.criteria.filter((_, index) => index !== indexToDelete);
      form.setValue("criteria", newCriteria, { shouldValidate: true });
    },
    [formData.criteria, form],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetForm();
      }
      onOpenChange?.(open);
    },
    [resetForm, onOpenChange],
  );

  const handleRubricNameChange = useCallback(
    (value: string) => {
      form.setValue("rubricName", value, { shouldValidate: true });
    },
    [form],
  );

  const handleTagChange = useCallback(
    (index: number, value: string) => {
      const newHeaders = [...formData.tags];
      newHeaders[index] = value;
      form.setValue("tags", newHeaders, { shouldValidate: true });
    },
    [formData.tags, form],
  );

  // Memoized components for better performance
  const ErrorAlert = useMemo(() => {
    if (!validationState.hasErrors) return null;

    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium mb-2">Please fix the following errors:</div>
          <ul className="list-disc pl-5 space-y-1">
            {errorsState.map((error, index) => (
              <li key={index} className="text-sm">
                {error}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }, [validationState.hasErrors, errorsState]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex flex-col min-w-[90vw] overflow-y-auto max-h-[90vh]"
      >
        <DialogHeader>
          <DialogTitle>Edit Rubric</DialogTitle>
          <DialogDescription>
            Modify the rubric details below. Use Ctrl+S to save changes or Escape to
            cancel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {ErrorAlert}

          <div className="space-y-2">
            <Label htmlFor="rubric-name" className="text-sm font-medium">
              Rubric Name
            </Label>
            <Input
              id="rubric-name"
              value={formData.rubricName}
              onChange={(e) => handleRubricNameChange(e.target.value)}
              className="font-bold"
              placeholder="Enter rubric name"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-center items-center gap-4">
            <div className="overflow-auto flex-1 max-h-[60vh] rounded-md border">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th
                      className={cn(
                        "text-center p-2 font-medium w-[250px]",
                        formData.tags.length > 0 && "border-r",
                      )}
                    >
                      Criterion
                    </th>
                    {formData.tags.map((header: string, index: number) => (
                      <th
                        key={`header-${index}`}
                        className={cn(
                          "p-2 w-[150px]",
                          index !== formData.tags.length - 1 && "border-r",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            id={`level-header-${index}`}
                            value={header}
                            onChange={(e) => handleTagChange(index, e.target.value)}
                            className="font-medium text-center break-words whitespace-normal h-auto min-h-[2.5rem] py-2"
                            disabled={isLoading}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive hover:text-white shrink-0"
                            onClick={() => handleDeleteLevel(index)}
                            disabled={isLoading || formData.tags.length <= 1}
                            title="Delete level"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {formData.criteria.length === 0 ?
                    <tr>
                      <td colSpan={formData.tags.length + 1} className="text-center p-8">
                        <div className="text-muted-foreground">
                          <p className="mb-2">No criteria available</p>
                          <p className="text-sm">
                            Click "Add New Criterion" to get started
                          </p>
                        </div>
                      </td>
                    </tr>
                  : formData.criteria.map((criterion, index) => (
                      <tr key={`criterion-${index}`} className="border-t">
                        <td className={cn("p-2", formData.tags.length > 0 && "border-r")}>
                          <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
                            <Label
                              className="text-xs font-medium text-muted-foreground"
                              htmlFor={`criterion-name-${index}`}
                            >
                              Name
                            </Label>
                            <Input
                              id={`criterion-name-${index}`}
                              value={criterion.name}
                              onChange={(e) =>
                                handleCriterionChange(index, "name", e.target.value)
                              }
                              className="font-medium break-words whitespace-normal h-auto min-h-[2.5rem] py-2"
                              disabled={isLoading}
                            />
                            <Label
                              className="text-xs font-medium text-muted-foreground"
                              htmlFor={`criterion-weight-${index}`}
                            >
                              Weight
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id={`criterion-weight-${index}`}
                                type="number"
                                min={0}
                                max={100}
                                value={criterion.weight}
                                onChange={(e) =>
                                  handleCriterionChange(
                                    index,
                                    "weight",
                                    Math.min(
                                      100,
                                      Math.max(0, Number.parseInt(e.target.value) || 0),
                                    ),
                                  )
                                }
                                className="max-w-20"
                                placeholder="0"
                                disabled={isLoading}
                              />
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                %
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 ml-auto text-destructive hover:bg-destructive hover:text-white"
                                onClick={() => handleDeleteCriterion(index)}
                                disabled={isLoading || formData.criteria.length <= 1}
                                title="Delete criterion"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </td>
                        {formData.tags.map((tag, tagIndex) => {
                          const criterionLevel = criterion.levels.find(
                            (level) => level.tag === tag,
                          );

                          return (
                            <td
                              key={`level-${index}-${tagIndex}`}
                              className={cn(
                                "p-2 h-full",
                                tagIndex !== formData.tags.length - 1 && "border-r",
                              )}
                            >
                              <div className="space-y-2">
                                <Label
                                  className="text-xs font-medium text-muted-foreground"
                                  htmlFor={`description-${index}-${tagIndex}`}
                                >
                                  Description
                                </Label>
                                <Textarea
                                  id={`description-${index}-${tagIndex}`}
                                  value={criterionLevel ? criterionLevel.description : ""}
                                  onChange={(e) =>
                                    handleLevelDescriptionChange(
                                      index,
                                      tagIndex,
                                      e.target.value,
                                    )
                                  }
                                  className="h-full resize-none text-sm min-h-[80px]"
                                  placeholder="Describe the performance level..."
                                  disabled={isLoading}
                                />
                                {criterionLevel && (
                                  <div className="flex items-center gap-2">
                                    <Label
                                      className="text-xs font-medium text-muted-foreground w-12"
                                      htmlFor={`level-weight-${index}-${tagIndex}`}
                                    >
                                      Weight
                                    </Label>
                                    <Input
                                      id={`level-weight-${index}-${tagIndex}`}
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={criterionLevel.weight}
                                      onChange={(e) =>
                                        handleLevelWeightChange(
                                          index,
                                          tagIndex,
                                          Math.min(
                                            100,
                                            Math.max(
                                              0,
                                              Number.parseInt(e.target.value) || 0,
                                            ),
                                          ),
                                        )
                                      }
                                      className="w-full"
                                      placeholder="0"
                                      disabled={isLoading}
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                      %
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            <div className="h-full flex justify-center items-center">
              <AddButton
                onClick={handleAddLevel}
                title="Add New Level"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="h-full flex justify-center items-center">
            <AddButton
              onClick={handleAddCriterion}
              title="Add New Criterion"
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="sm:justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Tip: Use Ctrl+S to save, Escape to cancel
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline" disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={isLoading || isValidating}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading || isValidating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
});

const AddButton = memo<{
  onClick: () => void;
  title: string;
  disabled?: boolean;
}>(({ onClick, title, disabled = false }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className="hover:bg-primary hover:text-primary-foreground"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export { EditRubric };
