import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { CriteriaSelector } from "@/types/grading";

interface ExactDialogProps {
  open: boolean;
  onClose: () => void;
  criterionMapping: CriteriaSelector;
  onConfirm: (path: string) => void;
}

export function ExactLocationDialog({
  open,
  onClose,
  criterionMapping,
  onConfirm,
}: ExactDialogProps) {
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");

  const addPathSegment = () => {
    if (currentInput.trim()) {
      setPathSegments([...pathSegments, currentInput.trim()]);
      setCurrentInput("");
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addPathSegment();
    }
  };

  const handleConfirm = () => {
    const segments = ["root", ...pathSegments];
    if (currentInput.trim()) {
      segments.push(currentInput.trim());
    }

    onConfirm(segments.join("/"));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="min-w-[60vw]">
        <DialogHeader>
          <DialogTitle>Specify Exact Path for {criterionMapping.criterion}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="rounded bg-muted p-3 text-xs text-muted-foreground">
            <div className="font-semibold mb-1">How to specify a path:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Use <code>*</code> for wildcard matching. Examples:
                <ul className="list-disc list-inside ml-4">
                  <li>
                    <code>*/file.pdf</code> matches <code>file.pdf</code> in any folder.
                  </li>
                  <li>
                    <code>*.txt</code> matches all <code>.txt</code> files.
                  </li>
                </ul>
              </li>
              <li>
                Press <b>Enter</b> to input the next file or folder segment.
              </li>
              <li>
                In the last input, enter a file extension (e.g. <code>.pdf</code>,{" "}
                <code>.txt</code>) to register a file path instead of a folder.
              </li>
            </ul>
          </div>
          {/* End Guide Section */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Path Segments</div>
            <div className="flex items-center space-x-2">
              {pathSegments.map((segment, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={segment}
                    onChange={(e) => {
                      const value = e.target.value;
                      const newSegments = [...pathSegments];
                      if (value === "") {
                        newSegments.splice(idx, 1);
                      } else {
                        newSegments[idx] = value;
                      }
                      setPathSegments(newSegments);
                    }}
                    onKeyUp={handleKeyUp}
                    className="max-w-24"
                  />
                  <div className="h-full flex items-center">/</div>
                </div>
              ))}
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyUp={handleKeyUp}
                className="max-w-24"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
