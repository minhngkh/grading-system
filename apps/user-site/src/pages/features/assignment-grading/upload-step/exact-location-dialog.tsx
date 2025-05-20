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
  const [paths, setPaths] = useState<string[]>([]); // new state for added paths

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

  // New function to add the current full path to paths list.
  const addCurrentPath = () => {
    if (pathSegments.length === 0 && !currentInput.trim()) return;
    const segments = ["root", ...pathSegments];
    if (currentInput.trim()) {
      segments.push(currentInput.trim());
    }
    const fullPath = segments.join("/");
    setPaths([...paths, fullPath]);
    // Clear current path input fields.
    setPathSegments([]);
    setCurrentInput("");
  };

  // Modified confirm to include any in-progress path and default to "*" if none provided.
  const handleConfirm = () => {
    let allPaths = [...paths];
    if (pathSegments.length > 0 || currentInput.trim()) {
      const segments = [...pathSegments];
      if (currentInput.trim()) {
        segments.push(currentInput.trim());
      }
      allPaths.push(segments.join("/"));
    }
    const finalPaths = allPaths.join(" ").trim();
    onConfirm(finalPaths !== "" ? finalPaths : "*");
  };

  // Edit a previously added path: remove it from list and parse into editable segments.
  const handleEditPath = (path: string, index: number) => {
    setPaths(paths.filter((_, i) => i !== index));
    const segments = path.split("/").slice(1); // remove "root"
    setPathSegments(segments);
    setCurrentInput("");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="min-w-[60vw]">
        <DialogHeader>
          <DialogTitle>Specify Exact Path for {criterionMapping.criterion}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="rounded bg-muted p-3 text-sm text-muted-foreground">
            <div className="font-semibold mb-1">How to specify path:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Use <code>*</code> to match any characters in a single folder.
                <ul className="list-disc list-inside ml-4">
                  <li>
                    <code>*.txt</code> matches all <code>.txt</code> files in the current
                    folder.
                  </li>
                  <li>
                    <code>*/file.pdf</code> matches <code>file.pdf</code> in any immediate
                    subfolder.
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
                </ul>
              </li>
              <li>
                Use forward slashes (<code>/</code>) for paths, even on Windows.
              </li>
              <li>
                Press <b>Enter</b> to input the next file or folder segment.
              </li>
              <li>
                In the last input, enter a file extension (e.g. <code>.pdf</code>,{" "}
                <code>.cs</code>) to register a file path.
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
                    onKeyDown={handleKeyUp}
                    className="max-w-24"
                  />
                  <div className="h-full flex items-center">/</div>
                </div>
              ))}
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyUp}
                className="max-w-24"
              />
            </div>
            {/* Button to add the current path string */}
            <Button variant="outline" onClick={addCurrentPath}>
              Add Path
            </Button>
            {/* Render added paths */}
          </div>
          {paths.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Added Paths:</div>
              <div className="flex flex-wrap gap-2">
                {paths.map((path, idx) => (
                  <Button key={idx} onClick={() => handleEditPath(path, idx)}>
                    {path}
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
