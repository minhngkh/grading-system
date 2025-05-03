import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { ExactLocationDialog } from "./exact-location-dialog";
import { ManualLocationDialog } from "./manual-location-dialog";
import { GradingAttempt } from "@/types/grading";

enum SelectLocationType {
  Manual,
  Exact,
}

interface CriteriaSelectorProps {
  gradingAttempt: GradingAttempt;
  uploadedFiles: File[];
  onGradingAttemptChange?: (attempt: GradingAttempt) => void;
}

export default function CriteriaMapper({
  uploadedFiles,
  gradingAttempt,
  onGradingAttemptChange,
}: CriteriaSelectorProps) {
  const [dialogType, setDialogType] = useState<SelectLocationType | null>(null);
  const [criterionPathType, setCriterionPathType] = useState<Record<number, string>>({});
  const [criteriaIndex, setCriteriaIndex] = useState<number>();

  const updateCriterionValue = (index: number, value: string) => {
    const updatedGradingAttempt = { ...gradingAttempt };
    updatedGradingAttempt.selectors[index].pattern = value;
    onGradingAttemptChange?.(updatedGradingAttempt);
  };

  const openDialog = (index: number, type: SelectLocationType | undefined) => {
    if (type !== undefined) {
      setCriteriaIndex(index);
      setDialogType(type);
    }
  };

  const closeDialog = () => {
    setDialogType(null);
    setCriteriaIndex(undefined);
  };

  const selectLocation = (index: number, path: string) => {
    updateCriterionValue(index, path);
    closeDialog();
  };

  return (
    <Card className="w-full gap-0 mt-4">
      <CardHeader>
        <CardTitle>
          File format detected: zip. Select content path for each criteria
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-4 font-semibold">
            <div>Criteria</div>
            <div>Select Method</div>
            <div></div>
          </div>

          {gradingAttempt.selectors.map((criterion, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 items-center">
              <div className="border rounded-md px-2 h-full flex items-center">
                {criterion.criterion}
              </div>

              <Select
                onValueChange={(value) => {
                  setCriterionPathType((prev) => ({
                    ...prev,
                    [index]: value,
                  }));
                }}
                value={criterionPathType[index] ?? ""}
              >
                <SelectTrigger className="w-full h-[100%]">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Exact">Exact</SelectItem>
                </SelectContent>
              </Select>

              <Button
                disabled={
                  SelectLocationType[
                    criterionPathType[index] as keyof typeof SelectLocationType
                  ] === undefined
                }
                variant="ghost"
                className="w-full h-full justify-start border rounded-md px-3 py-2 text-left cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  openDialog(
                    index,
                    SelectLocationType[
                      criterionPathType[index] as keyof typeof SelectLocationType
                    ],
                  );
                }}
              >
                <div className="truncate">
                  {criterion.pattern === "*" ? "All files" : criterion.pattern}
                </div>
              </Button>
            </div>
          ))}
        </div>

        {criteriaIndex !== undefined && (
          <ManualLocationDialog
            open={dialogType === SelectLocationType.Manual}
            onClose={closeDialog}
            criterionName={gradingAttempt.selectors[criteriaIndex].criterion}
            criterionIndex={criteriaIndex}
            uploadedFiles={uploadedFiles}
            onSelect={selectLocation}
          />
        )}

        {criteriaIndex !== undefined && (
          <ExactLocationDialog
            open={dialogType === SelectLocationType.Exact}
            onClose={closeDialog}
            criterionMapping={gradingAttempt.selectors[criteriaIndex]}
            onConfirm={(path) => {
              updateCriterionValue(criteriaIndex, path);
              closeDialog();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
