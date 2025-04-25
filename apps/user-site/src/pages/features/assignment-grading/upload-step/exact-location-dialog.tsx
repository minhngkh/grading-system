import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExactDialogProps {
  open: boolean;
  onClose: () => void;
  criterionName: string;
  criterionIndex: number;
  onConfirm: (path: string) => void;
}

export function ExactLocationDialog({
  open,
  onClose,
  criterionName,
  onConfirm,
}: ExactDialogProps) {
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [locationType, setLocationType] = useState<"file" | "folder">("folder");

  const addPathSegment = () => {
    if (currentInput.trim()) {
      setPathSegments([...pathSegments, currentInput.trim()]);
      setCurrentInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addPathSegment();
    }
  };

  const handleConfirm = () => {
    onConfirm(pathSegments.join("/"));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="min-w-[60vw]">
        <DialogHeader>
          <DialogTitle>Specify Exact Path for {criterionName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Location Type</div>
            <Select
              value={locationType}
              onValueChange={(value) =>
                setLocationType(value as "file" | "folder")
              }>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="folder">Folder</SelectItem>
                <SelectItem value="file">File</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                    onKeyDown={handleKeyDown}
                    className="max-w-24"
                  />
                  <div className="h-full flex items-center">/</div>
                </div>
              ))}
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
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
