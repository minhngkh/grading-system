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
import { useState } from "react";

interface ChangeScaleFactorDialogProps {
  initialScaleFactor: number;
  onChangeScaleFactor: (newScaleFactor: number) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ChangeScaleFactorDialog = ({
  initialScaleFactor,
  onChangeScaleFactor,
  open,
  onOpenChange,
}: ChangeScaleFactorDialogProps) => {
  const [scaleFactor, setScaleFactor] = useState(initialScaleFactor);

  const handleSave = () => {
    onChangeScaleFactor(scaleFactor);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Scale Factor</DialogTitle>
          <DialogDescription>
            Make changes to the scale factor here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Input
          min={1}
          type="number"
          value={scaleFactor}
          onChange={(e) => setScaleFactor(Number(e.target.value))}
        />
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
