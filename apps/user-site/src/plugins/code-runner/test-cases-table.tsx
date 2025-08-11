import { useMemo, useState } from "react";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import type { CodeRunnerTestCase } from "@/types/plugin";

interface TestCasesTableProps {
  testCases: CodeRunnerTestCase[];
  onUpdateCell: (index: number, field: "input" | "expectedOutput" | "useRegex" | "description", value: string | boolean) => void;
  onDeleteRow: (index: number) => void;
  useArgsOrStdin: "args" | "stdin";
}

export default function TestCasesTable({
  testCases,
  onUpdateCell,
  onDeleteRow,
  useArgsOrStdin,
}: TestCasesTableProps) {
  const [regexErrors, setRegexErrors] = useState<{ [index: number]: string }>({});
  
  const validateRegex = (pattern: string, index: number) => {
    try {
      // eslint-disable-next-line no-new
      new RegExp(pattern);
      setRegexErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
      return true;
    } catch (error) {
      setRegexErrors(prev => ({
        ...prev,
        [index]: error instanceof Error ? error.message : 'Invalid regex pattern'
      }));
      return false;
    }
  };

  const handleRegexToggle = (index: number, checked: boolean) => {
    onUpdateCell(index, "useRegex", checked);
    
    // If enabling regex, validate the current expected output
    if (checked && index < testCases.length) {
      validateRegex(testCases[index].expectedOutput, index);
    } else {
      // Clear regex error when disabling regex
      setRegexErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const handleExpectedOutputChange = (index: number, value: string) => {
    onUpdateCell(index, "expectedOutput", value);
    
    // Validate regex if regex is enabled for this test case
    if (index < testCases.length && testCases[index].useRegex) {
      validateRegex(value, index);
    }
  };

  const inputLabel = useArgsOrStdin === "args" ? "Arguments" : "Input";
  const inputPlaceholder = useArgsOrStdin === "args" ? "Enter arguments..." : "Enter input...";
  
  const displayRows = useMemo(() => [
    ...testCases, 
    { input: "", expectedOutput: "", useRegex: false, description: "" }
  ], [testCases]);

  return (
    <div className="space-y-2">
      <h3 className="text-md font-semibold">Test Cases</h3>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center font-semibold border-r">{inputLabel}</TableHead>
              <TableHead className="text-center font-semibold border-r">
                Expected Output
              </TableHead>
              <TableHead className="text-center font-semibold border-r">
                Use Regex
              </TableHead>
              <TableHead className="text-center font-semibold" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, index) => {
              const isExtraRow = index >= testCases.length;
              const hasRegexError = !isExtraRow && regexErrors[index];
              const rowKey = isExtraRow ? 'new-row' : `test-case-${index}`;
              return (
                <TableRow key={rowKey}>
                  <TableCell className="p-2 border-r align-top">
                    <Textarea
                      value={row.input}
                      onChange={(e) => onUpdateCell(index, "input", e.target.value)}
                      placeholder={inputPlaceholder}
                      className="w-full min-h-[60px] resize-y border border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                      rows={2}
                    />
                  </TableCell>
                  <TableCell className="p-2 border-r align-top">
                    <div className="space-y-1">
                      <Textarea
                        value={row.expectedOutput}
                        onChange={(e) => handleExpectedOutputChange(index, e.target.value)}
                        placeholder="Enter expected output..."
                        className={`w-full min-h-[60px] resize-y border focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 ${
                          hasRegexError ? 'border-red-500' : 'border-gray-300'
                        }`}
                        rows={2}
                      />
                      {hasRegexError && (
                        <p className="text-xs text-red-500 mt-1">{hasRegexError}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-2 border-r text-center align-top">
                    <div className="pt-2">
                      <Checkbox
                        checked={row.useRegex}
                        onCheckedChange={(checked) => handleRegexToggle(index, checked as boolean)}
                        disabled={isExtraRow}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="p-2 text-center align-top">
                    <div className="pt-2">
                      <Button
                        disabled={isExtraRow}
                        onClick={() => onDeleteRow(index)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
