import type { Criteria, Rubric } from "@/types/rubric";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RubricSchema } from "@/types/rubric";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, PencilIcon, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface EditRubricProps {
  rubricData: Rubric;
  onUpdate: (rubric: Rubric) => void;
}

type FormState = {
  errors?: Record<string, string>;
  message?: string;
};

export default function EditRubric({ rubricData, onUpdate }: EditRubricProps) {
  const [open, setOpen] = useState(false);
  const [errorsState, setErrorState] = useState<FormState>({
    errors: {},
    message: "",
  });
  const form = useForm<Rubric>({
    resolver: zodResolver(RubricSchema),
    defaultValues: rubricData,
  });

  // Add this to watch form changes
  const formData = form.watch();
  const hasErrors = errorsState?.errors && Object.keys(errorsState.errors).length > 0;

  const handleCriterionChange = (
    index: number,
    field: keyof (typeof rubricData.criteria)[0],
    value: string,
  ) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    form.setValue("criteria", newCriteria);
  };

  const handleLevelDescriptionChange = (
    criterionIndex: number,
    tagIndex: number,
    value: string,
  ) => {
    const newCriteria = [...formData.criteria];
    const performanceTag = formData.performanceTags[tagIndex];

    const levelIndex = newCriteria[criterionIndex].levels.findIndex(
      (level) => level.performanceTag === performanceTag,
    );

    if (value.length === 0) {
      if (levelIndex !== -1) {
        newCriteria[criterionIndex].levels.splice(levelIndex, 1);
      }
    } else {
      const newLevel = {
        description: value,
        points: 0,
        performanceTag,
      };

      if (levelIndex === -1) {
        newCriteria[criterionIndex].levels.push(newLevel);
      } else {
        newCriteria[criterionIndex].levels[levelIndex] = newLevel;
      }
    }

    form.setValue("criteria", newCriteria);
  };

  const handleLevelPointChange = (
    criterionIndex: number,
    tagIndex: number,
    points: number,
  ) => {
    const newCriteria = [...formData.criteria];
    const performanceTag = formData.performanceTags[tagIndex];

    const levelIndex = newCriteria[criterionIndex].levels.findIndex(
      (level) => level.performanceTag === performanceTag,
    );

    if (levelIndex !== -1) {
      newCriteria[criterionIndex].levels[levelIndex].points = points;
    }

    form.setValue("criteria", newCriteria);
  };

  const handleSave = async () => {
    // Validate form data
    const result = RubricSchema.safeParse(form.getValues());

    // If validation fails, return errors
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join(".");
        errors[path] = error.message;
      });

      setErrorState({
        errors,
        message: "Please fix the errors in the form",
      });

      return;
    }

    setErrorState({
      errors: {},
      message: "",
    });
    onUpdate(formData);
    setOpen(false);
  };

  const handleAddLevel = () => {
    const newHeaders = [
      ...formData.performanceTags,
      `Level ${formData.performanceTags.length + 1}`,
    ];

    form.setValue("performanceTags", newHeaders);
  };

  const handleAddCriterion = () => {
    const newCriteria: Criteria[] = [
      ...formData.criteria,
      {
        name: `Criterion ${formData.criteria.length + 1}`,
        totalCriterionPoints: 0,
        levels: [],
      },
    ];

    form.setValue("criteria", newCriteria);
  };

  const handleDeleteLevel = (indexToDelete: number) => {
    const newHeaders = formData.performanceTags.filter(
      (_, index) => index !== indexToDelete,
    );
    const newCriteria = formData.criteria.map((criterion) => ({
      ...criterion,
      levels: criterion.levels.filter(
        (level) => level.performanceTag !== formData.performanceTags[indexToDelete],
      ),
    }));
    form.setValue("performanceTags", newHeaders);
    form.setValue("criteria", newCriteria);
  };

  const handleDeleteCriterion = (indexToDelete: number) => {
    const newCriteria = formData.criteria.filter((_, index) => index !== indexToDelete);
    form.setValue("criteria", newCriteria);
  };

  const formatErrorPath = (path: string) => {
    return path
      .replace(/\./g, " › ")
      .replace(/\[(\d+)\]/g, " #$1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            form.reset(rubricData);
            setErrorState({
              errors: {},
              message: "",
            });
            setOpen(true);
          }}
          variant="ghost"
          size="icon"
        >
          <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="flex flex-col min-w-[90%]">
        <DialogHeader>
          <DialogTitle>Edit Rubric</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          {hasErrors && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Please fix the following errors:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {errorsState.errors &&
                    Object.entries(errorsState.errors).map(([field, message]) => (
                      <li key={field} className="text-sm">
                        <span className="font-medium">{formatErrorPath(field)}:</span>{" "}
                        {message}
                      </li>
                    ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Input
            id="rubric-name"
            value={formData.rubricName}
            onChange={(e) => form.setValue("rubricName", e.target.value)}
            className="font-bold truncate w-full"
            placeholder="Rubric Name"
          />
          <div className="flex justify-center items-center gap-4">
            <div className="overflow-auto flex-1 max-h-[60vh] rounded-md border">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 border-r font-medium w-[250px]">
                      Criterion
                    </th>
                    {formData.performanceTags?.map((header: string, index: number) => (
                      <th
                        key={index}
                        className={cn(
                          "p-2 w-[150px]",
                          index !== formData.performanceTags.length - 1 ? "border-r" : "",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            id={`level-header-${index}`}
                            value={header}
                            onChange={(e) => {
                              const newHeaders = [...formData.performanceTags];
                              newHeaders[index] = e.target.value;
                              form.setValue("performanceTags", newHeaders);
                            }}
                            className="font-medium text-center break-words whitespace-normal h-auto min-h-[2.5rem] py-2"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive hover:text-white"
                            onClick={() => handleDeleteLevel(index)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {formData.criteria.map((criterion, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2 border-r">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              id={`criterion-name-${index}`}
                              value={criterion.name}
                              onChange={(e) =>
                                handleCriterionChange(index, "name", e.target.value)
                              }
                              className="font-medium break-words whitespace-normal h-auto min-h-[2.5rem] py-2"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive hover:text-white"
                              onClick={() => handleDeleteCriterion(index)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                      </td>
                      {formData.performanceTags.map((tag, tagIndex) => {
                        const criterionLevel = criterion.levels.find(
                          (level) => level.performanceTag === tag,
                        );

                        return (
                          <td
                            key={tagIndex}
                            className={cn(
                              "p-2 h-full",
                              tagIndex !== formData.performanceTags.length - 1
                                ? "border-r"
                                : "",
                            )}
                          >
                            <div className="space-y-2">
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
                                className="h-full resize-none text-sm"
                              />
                              {criterionLevel && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={criterionLevel.points}
                                    onChange={(e) =>
                                      handleLevelPointChange(
                                        index,
                                        tagIndex,
                                        Number.parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="w-full"
                                    placeholder="Points"
                                  />
                                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    points
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="h-full flex justify-center items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleAddLevel}>
                      <PlusCircle />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add New Level</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="h-full flex justify-center items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleAddCriterion}>
                    <PlusCircle />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add New Criterion</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
