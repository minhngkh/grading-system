import { RubricView } from "@/components/app/rubric-view";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Rubric } from "@/types/rubric";
import { useEffect } from "react";

type RubricDialogProps = {
  initialRubric?: Rubric;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ViewRubricDialog({
  initialRubric,
  open,
  onOpenChange,
}: RubricDialogProps) {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange?.(false);
      } else if (e.key === "r" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="min-w-[80%] max-w-[95%] max-h-[90vh] flex flex-col gap-0"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Rubric: {initialRubric?.rubricName}
          </DialogTitle>
          <DialogDescription>
            View the details of the rubric including its criteria and scoring.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-4">
          <div className="w-full h-[60vh] overflow-y-auto flex flex-col">
            {initialRubric ?
              <RubricView rubricData={initialRubric} />
            : <p>No rubric available</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
