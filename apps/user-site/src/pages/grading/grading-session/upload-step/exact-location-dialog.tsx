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
  const [currentInput, setCurrentInput] = useState<string>("");
  const [paths, setPaths] = useState<string[]>([]);

  const addPath = () => {
    if (!currentInput.trim()) return;
    setPaths([...paths, currentInput.trim()]);
    setCurrentInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPath();
    }
  };

  const handleConfirm = () => {
    let allPaths = [...paths];
    if (currentInput.trim()) {
      allPaths.push(currentInput.trim());
    }

    const finalPaths = allPaths.join(" ").trim();
    onConfirm(finalPaths !== "" ? finalPaths : "*");
  };

  const handleEditPath = (path: string, index: number) => {
    setPaths(paths.filter((_, i) => i !== index));
    setCurrentInput(path);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="min-w-[60vw] overflow-y-auto max-h-[80vh]"
      >
        <DialogHeader>
          <DialogTitle>Specify Exact Path for {criterionMapping.criterion}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {" "}
          <div className="rounded bg-muted p-3 text-sm text-muted-foreground">
            <div className="font-semibold mb-1">How to specify paths:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Use <code>*</code> to match any characters in a single folder.
                <ul className="list-disc list-inside ml-4">
                  <li>
                    <code>*.txt</code> matches all <code>.txt</code> files in the current
                    folder.
                  </li>
                  <li>
                    <code>src/*.js</code> matches all <code>.js</code> files in the 'src'
                    folder.
                  </li>
                </ul>
              </li>
              <li>
                Use <code>**</code> to match folders recursively.
                <ul className="list-disc list-inside ml-4">
                  <li>
                    <code>**/*.json</code> matches all <code>.json</code> files in all
                    subfolders.
                  </li>
                  <li>
                    <code>src/**/*.ts</code> matches all <code>.ts</code> files in 'src'
                    and all its subfolders.
                  </li>
                </ul>
              </li>
              <li>
                Use forward slashes (<code>/</code>) for paths, even on Windows.
              </li>
              <li>
                Press <b>Enter</b> to add the current path to the list.
              </li>
              <li>You can add multiple paths and they will be combined.</li>
            </ul>
          </div>
          {/* End Guide Section */}{" "}
          <div className="space-y-2">
            <div className="text-sm font-medium">Path Input</div>
            <div className="flex items-center space-x-2">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter path pattern (e.g. **/*.js)"
                className="flex-1"
              />
              <Button variant="outline" onClick={addPath}>
                Add Path
              </Button>
            </div>
            {/* Render added paths */}
          </div>{" "}
          {paths.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="text-sm font-medium">Added Paths:</div>
              <div className="flex flex-wrap gap-2">
                {paths.map((path, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="flex items-center gap-2 group"
                    onClick={() => handleEditPath(path, idx)}
                  >
                    <span>{path}</span>
                    <span className="opacity-50 group-hover:opacity-100">&times;</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
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
