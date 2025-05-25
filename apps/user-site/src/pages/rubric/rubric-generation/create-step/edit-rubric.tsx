import type { Criteria, Level, Rubric } from "@/types/rubric";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { RubricSchema } from "@/types/rubric";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, PencilIcon, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface EditRubricProps {
  rubricData: Rubric;
  onUpdate?: (rubric: Rubric) => void;
  disableEdit?: boolean;
}

export default function EditRubric({
  rubricData,
  onUpdate,
  disableEdit = false,
}: EditRubricProps) {
  const [errorsState, setErrorState] = useState<string[]>([]);

  const form = useForm<Rubric>({
    resolver: zodResolver(RubricSchema),
    defaultValues: rubricData,
  });

  // Add this to watch form changes
  const formData = form.watch();
  const hasErrors = errorsState.length > 0;

  const handleCriterionChange = (
    index: number,
    field: keyof (typeof rubricData.criteria)[0],
    value: string | number,
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

    form.setValue("criteria", newCriteria);
  };

  const handleLevelWeightChange = (
    criterionIndex: number,
    tagIndex: number,
    points: number,
  ) => {
    const newCriteria = [...formData.criteria];
    const performanceTag = formData.tags[tagIndex];

    const levelIndex = newCriteria[criterionIndex].levels.findIndex(
      (level) => level.tag === performanceTag,
    );

    if (levelIndex !== -1) {
      newCriteria[criterionIndex].levels[levelIndex].weight = points;
    }

    form.setValue("criteria", newCriteria);
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Validate form data
    const result = RubricSchema.safeParse(form.getValues());

    // If validation fails, return errors
    if (!result.success) {
      const errors: Set<string> = new Set();
      result.error.errors.forEach((error) => {
        errors.add(error.message);
      });

      setErrorState(Array.from(errors));

      e.preventDefault();
      return;
    }

    setErrorState([]);
    onUpdate?.(formData);
  };

  const handleAddLevel = () => {
    const newHeaders = [...formData.tags, `Level ${formData.tags.length + 1}`];

    form.setValue("tags", newHeaders);
  };

  const handleAddCriterion = () => {
    const newCriteria: Criteria[] = [
      ...formData.criteria,
      {
        name: `Criterion ${formData.criteria.length + 1}`,
        weight: 0,
        levels: [],
      },
    ];

    form.setValue("criteria", newCriteria);
  };

  const handleDeleteLevel = (indexToDelete: number) => {
    const newHeaders = formData.tags.filter((_, index) => index !== indexToDelete);
    const newCriteria = formData.criteria.map((criterion) => ({
      ...criterion,
      levels: criterion.levels.filter(
        (level) => level.tag !== formData.tags[indexToDelete],
      ),
    }));
    form.setValue("tags", newHeaders);
    form.setValue("criteria", newCriteria);
  };

  const handleDeleteCriterion = (indexToDelete: number) => {
    const newCriteria = formData.criteria.filter((_, index) => index !== indexToDelete);
    form.setValue("criteria", newCriteria);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          disabled={disableEdit}
          onClick={() => {
            form.reset(rubricData);
            setErrorState([]);
          }}
          size="icon"
        >
          <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="flex flex-col min-w-[90vw] overflow-y-auto max-h-[90vh]"
      >
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
                  {errorsState.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
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
                        key={index}
                        className={cn(
                          "p-2 w-[150px]",
                          index !== formData.tags.length - 1 && "border-r",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            id={`level-header-${index}`}
                            value={header}
                            onChange={(e) => {
                              const newHeaders = [...formData.tags];
                              newHeaders[index] = e.target.value;
                              form.setValue("tags", newHeaders);
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
                  {formData.criteria.length === 0 ? (
                    <tr>
                      <td colSpan={formData.tags.length + 1} className="text-center p-4">
                        No criteria available. Please add a criterion.
                      </td>
                    </tr>
                  ) : (
                    formData.criteria.map((criterion, index) => (
                      <tr key={index} className="border-t">
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
                                value={criterion.weight}
                                onChange={(e) =>
                                  handleCriterionChange(
                                    index,
                                    "weight",
                                    Number.parseInt(e.target.value) || 0,
                                  )
                                }
                                className="max-w-20"
                                placeholder="Weight"
                              />
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                %
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 ml-auto text-destructive hover:bg-destructive hover:text-white"
                                onClick={() => handleDeleteCriterion(index)}
                              >
                                <Trash2 />
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
                              key={tagIndex}
                              className={cn(
                                "p-2 h-full",
                                tagIndex !== formData.tags.length - 1 && "border-r",
                              )}
                            >
                              <div className="space-y-2">
                                {/* Add description label above textarea */}
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
                                  className="h-full resize-none text-sm"
                                />
                                {criterionLevel && (
                                  <div className="flex items-center gap-2">
                                    {/* Add weight label to the left of weight input */}
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
                                      value={criterionLevel.weight}
                                      onChange={(e) =>
                                        handleLevelWeightChange(
                                          index,
                                          tagIndex,
                                          Number.parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="w-full"
                                      placeholder="Weight"
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
                  )}
                </tbody>
              </table>
            </div>
            <div className="h-full flex justify-center items-center">
              {formData.tags.length < 6 && (
                <AddButton onClick={handleAddLevel} title="Add New Level" />
              )}
            </div>
          </div>
          <div className="h-full flex justify-center items-center">
            <AddButton onClick={handleAddCriterion} title="Add New Criterion" />
          </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const AddButton = ({ onClick, title }: { onClick: () => void; title: string }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={onClick}>
            <PlusCircle />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
