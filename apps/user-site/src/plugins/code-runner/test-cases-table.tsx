import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { CodeRunnerTestCase } from "@/types/plugin";
import { Trash2 } from "lucide-react";

interface TestCasesTableProps {
  testCases: CodeRunnerTestCase[];
  onUpdateCell: (index: number, field: "input" | "expectedOutput", value: string) => void;
  onDeleteRow: (index: number) => void;
}

export default function TestCasesTable({
  testCases,
  onUpdateCell,
  onDeleteRow,
}: TestCasesTableProps) {
  const displayRows = [...testCases, { input: "", expectedOutput: "" }];

  return (
    <div className="space-y-2">
      <h3 className="text-md font-semibold">Test Cases</h3>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center font-semibold border-r">Input</TableHead>
              <TableHead className="text-center font-semibold border-r">
                Expected Output
              </TableHead>
              <TableHead className="text-center font-semibold" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, index) => {
              const isExtraRow = index >= testCases.length;
              return (
                <TableRow key={index}>
                  <TableCell className="p-2 border-r">
                    <Input
                      value={row.input}
                      onChange={(e) => onUpdateCell(index, "input", e.target.value)}
                      placeholder="Enter input..."
                      className="w-full border border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                    />
                  </TableCell>
                  <TableCell className="p-2 border-r">
                    <Input
                      value={row.expectedOutput}
                      onChange={(e) =>
                        onUpdateCell(index, "expectedOutput", e.target.value)
                      }
                      placeholder="Enter expected output..."
                      className="w-full border border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                    />
                  </TableCell>
                  <TableCell className="p-2 text-center">
                    <Button
                      disabled={isExtraRow}
                      onClick={() => onDeleteRow(index)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
