import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { PluginDialogConfigProps } from "./type";
import { PluginService } from "@/services/plugin-service";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { CodeRunnerTestCase } from "@/types/plugin";
import { DialogClose } from "@radix-ui/react-dialog";

export default function CodeRunnerConfigDialog({
  open,
  onOpenChange,
  onCriterionConfigChange,
  criterionIndex,
}: PluginDialogConfigProps) {
  const [testCases, setTestCases] = useState<CodeRunnerTestCase[]>([
    { input: "", expectedOutput: "" },
  ]);

  const auth = useAuth();

  const addTestCase = () => {
    const newTestCase: CodeRunnerTestCase = {
      input: "",
      expectedOutput: "",
    };
    setTestCases([...testCases, newTestCase]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (
    index: number,
    field: "input" | "expectedOutput",
    value: string,
  ) => {
    setTestCases(
      testCases.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc)),
    );
  };

  const handleConfirm = async () => {
    try {
      const token = await auth.getToken();
      if (!token) {
        throw new Error("User is not authenticated");
      }

      const codeRunnerConfig = {
        testCases,
      };

      const config = await PluginService.createCodeRunnerConfig(codeRunnerConfig, token);

      onCriterionConfigChange?.(config, criterionIndex);
      onOpenChange?.(false);
    } catch (error) {
      toast.error("Failed to set Code Runner configuration. Please try again.");
      console.error("Error setting Code Runner configuration:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Code Runner Plugin Configuration</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This plugin allows you to run code snippets and evaluate their output as part
            of the rubric criteria. Configure test cases below.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold">Test Cases</h3>
              <Button onClick={addTestCase} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Test Case
              </Button>
            </div>

            {testCases.map((testCase, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Test Case {index + 1}</h4>
                  {testCases.length > 1 && (
                    <Button
                      onClick={() => removeTestCase(index)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Input</label>
                    <Textarea
                      value={testCase.input}
                      onChange={(e) => updateTestCase(index, "input", e.target.value)}
                      placeholder="Enter test input..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Expected Output
                    </label>
                    <Textarea
                      value={testCase.expectedOutput}
                      onChange={(e) =>
                        updateTestCase(index, "expectedOutput", e.target.value)
                      }
                      placeholder="Enter expected output..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
