import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ManualLocationDialog } from "./manual-location-dialog";
import { ExactLocationDialog } from "./exact-location-dialog";

enum SelectLocationType {
  Manual,
  Exact,
}

interface Criterion {
  name: string;
  method: SelectLocationType;
  value: string;
}

interface CriteriaSelectorProps {
  uploadedFiles: File[];
}

export default function CriteriaSelector({
  uploadedFiles,
}: CriteriaSelectorProps) {
  const [criteria, setCriteria] = useState<Criterion[]>([
    {
      name: "Docker file convention",
      method: SelectLocationType.Manual,
      value: "",
    },
    {
      name: "Code format",
      method: SelectLocationType.Exact,
      value: "",
    },
  ]);

  const [dialogType, setDialogType] = useState<SelectLocationType | null>(null);

  const updateCriterionMethod = (index: number, method: SelectLocationType) => {
    setCriteria((prev) =>
      prev.map((criterion, i) =>
        i === index ? { ...criterion, method } : criterion
      )
    );
  };

  const updateCriterionValue = (index: number, value: string) => {
    setCriteria((prev) =>
      prev.map((criterion, i) =>
        i === index ? { ...criterion, value } : criterion
      )
    );
  };

  const openDialog = (type: SelectLocationType) => {
    setDialogType(type);
  };

  const closeDialog = () => {
    setDialogType(null);
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

          {criteria.map((criterion, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 items-center">
              <div className="border rounded-md px-2 h-full flex items-center">
                {criterion.name}
              </div>

              <Select
                value={SelectLocationType[criterion.method]}
                onValueChange={(value) =>
                  updateCriterionMethod(
                    index,
                    SelectLocationType[value as keyof typeof SelectLocationType]
                  )
                }>
                <SelectTrigger className="w-full h-[100%]">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Exact">Exact</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                className={`w-full h-full justify-start border rounded-md px-3 py-2 text-left ${
                  SelectLocationType[criterion.method]
                    ? "cursor-pointer hover:bg-muted/50"
                    : ""
                }`}
                onClick={() => {
                  openDialog(criterion.method);
                }}
                disabled={!SelectLocationType[criterion.method]}>
                {criterion.value.length === 0
                  ? "Choose File or Folder"
                  : criterion.value}
              </Button>

              {/* Manual File Location Dialog */}
              {uploadedFiles.length &&
                criterion.method === SelectLocationType.Manual && (
                  <ManualLocationDialog
                    open={dialogType === SelectLocationType.Manual}
                    onClose={closeDialog}
                    criterionName={criterion.name}
                    criterionIndex={index}
                    uploadedFiles={uploadedFiles}
                    onSelect={selectLocation}
                  />
                )}

              {/* Exact Path Dialog */}
              {criterion.method === SelectLocationType.Exact && (
                <ExactLocationDialog
                  open={dialogType === SelectLocationType.Exact}
                  onClose={closeDialog}
                  criterionName={criterion.name}
                  criterionIndex={index}
                  onConfirm={(path) => {
                    updateCriterionValue(index, path);
                    closeDialog();
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
