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
import { Label } from "@/components/ui/label";
import { useState, useCallback, useEffect, useMemo } from "react";

interface ChangeScaleFactorDialogProps {
  initialScaleFactor: number;
  onChangeScaleFactor: (newScaleFactor: number) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  minValue?: number;
  maxValue?: number;
}

export const ChangeScaleFactorDialog = ({
  initialScaleFactor,
  onChangeScaleFactor,
  open,
  onOpenChange,
  minValue = 1,
  maxValue = 100,
}: ChangeScaleFactorDialogProps) => {
  const [scaleFactor, setScaleFactor] = useState<number>(initialScaleFactor);

  useEffect(() => {
    if (open) {
      setScaleFactor(initialScaleFactor);
    }
  }, [open, initialScaleFactor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          handleSave();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange?.(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSave = useCallback(() => {
    onChangeScaleFactor(scaleFactor);
    onOpenChange?.(false);
  }, [onChangeScaleFactor, onOpenChange]);

  // Handle dialog close
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Could add confirmation dialog here for unsaved changes
      }
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  // Memoized validation state
  const validationState = useMemo(() => {
    const isValid = scaleFactor != undefined;
    const canSave = isValid;

    return {
      isValid,
      canSave,
    };
  }, [scaleFactor]);

  // Format suggestion for common values
  const suggestions = useMemo(() => {
    const common = [4, 10, 100];
    return common.filter(
      (val) => val >= minValue && val <= maxValue && val !== initialScaleFactor,
    );
  }, [minValue, maxValue, initialScaleFactor]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-[500]">
        <DialogHeader>
          <DialogTitle>Change Grade Scale</DialogTitle>
          <DialogDescription>
            Adjust the grade scale to modify the scoring multiplier.
            <br />
            {minValue != undefined && maxValue != undefined && (
              <>
                Valid range: {minValue} - {maxValue}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Grade Scale</Label>
            <Input
              id="grade-scale"
              type="number"
              min={minValue}
              max={maxValue}
              step="1"
              value={scaleFactor}
              onChange={(e) => setScaleFactor(parseInt(e.target.value))}
              placeholder="Enter grade scale"
              autoFocus
            />
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Quick Select:
              </Label>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 6).map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => setScaleFactor(value)}
                    className="h-8 px-3 text-xs"
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Tip: Press Enter to save, Escape to cancel
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={!validationState.canSave}
              className="min-w-[100px]"
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
