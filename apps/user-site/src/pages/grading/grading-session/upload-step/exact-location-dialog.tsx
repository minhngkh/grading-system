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
import { Info } from "lucide-react";

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
          <div className="rounded-lg border border-muted bg-muted/50 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-2 font-semibold text-foreground">
              <Info className="w-4 h-4 text-primary" />
              How to specify paths
            </div>
            <ul className="list-none space-y-3 pl-1">
              <li>
                <span className="font-medium text-foreground">
                  Wildcard <code>*</code>:
                </span>{" "}
                Matches any characters in a single folder.
                <ul className="list-disc list-inside pl-5 mt-1 space-y-1">
                  <li>
                    <code>*.txt</code> → All <code>.txt</code> files in the current folder
                  </li>
                  <li>
                    <code>src/*.js</code> → All <code>.js</code> files in the{" "}
                    <code>src</code> folder
                  </li>
                </ul>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Recursive <code>**</code>:
                </span>{" "}
                Matches files in all subfolders.
                <ul className="list-disc list-inside pl-5 mt-1 space-y-1">
                  <li>
                    <code>**/*.json</code> → All <code>.json</code> files in all folders
                  </li>
                  <li>
                    <code>src/**/*.ts</code> → All <code>.ts</code> files in{" "}
                    <code>src</code> and subfolders
                  </li>
                </ul>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Use <code>/</code> as the path separator
                </span>{" "}
                — even on Windows
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Press <kbd>Enter</kbd>
                </span>{" "}
                to add the current path
              </li>
              <li>
                <span className="font-medium text-foreground">Multiple patterns</span>{" "}
                will be combined
              </li>
            </ul>
          </div>
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
