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
import { Trash2 } from "lucide-react";

interface EnvironmentVariablesTableProps {
  environmentVariables: Record<string, string>;
  onUpdateEnvVar: (index: number, field: "key" | "value", value: string) => void;
  onDeleteEnvVar: (index: number) => void;
}

export default function EnvironmentVariablesTable({
  environmentVariables,
  onUpdateEnvVar,
  onDeleteEnvVar,
}: EnvironmentVariablesTableProps) {
  const envVarEntries = Object.entries(environmentVariables || {});
  const displayEnvVars = [...envVarEntries, ["", ""]];

  return (
    <div className="space-y-2">
      <h3 className="text-md font-semibold">Environment Variables (Optional)</h3>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center font-semibold border-r">Key</TableHead>
              <TableHead className="text-center font-semibold border-r">Value</TableHead>
              <TableHead className="text-center font-semibold" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayEnvVars.map(([key, value], index) => {
              const isExtraRow = index >= envVarEntries.length;
              return (
                <TableRow key={index}>
                  <TableCell className="p-2 border-r">
                    <Input
                      value={key}
                      onChange={(e) => onUpdateEnvVar(index, "key", e.target.value)}
                      placeholder="Enter key..."
                      className="w-full border border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                    />
                  </TableCell>
                  <TableCell className="p-2 border-r">
                    <Input
                      value={value}
                      onChange={(e) => onUpdateEnvVar(index, "value", e.target.value)}
                      placeholder="Enter value..."
                      className="w-full border border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                    />
                  </TableCell>
                  <TableCell className="p-2 text-center">
                    <Button
                      disabled={isExtraRow}
                      onClick={() => onDeleteEnvVar(index)}
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
