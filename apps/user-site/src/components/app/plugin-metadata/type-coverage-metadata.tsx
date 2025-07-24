import { BarChart3, Percent } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface TypeCoverageMetadataType {
  percentage: number;
  totalLines: number;
  coveredLines: number;
  uncoveredFiles?: string[];
}

interface TypeCoverageMetadataProps {
  metadata: TypeCoverageMetadataType;
}

export function TypeCoverageMetadata({ metadata }: TypeCoverageMetadataProps) {
  const { percentage, totalLines, coveredLines, uncoveredFiles = [] } = metadata;

  const getCoverageStatus = (percentage: number) => {
    if (percentage >= 90) return { color: "bg-green-500", text: "Excellent" };
    if (percentage >= 75) return { color: "bg-blue-500", text: "Good" };
    if (percentage >= 50) return { color: "bg-yellow-500", text: "Fair" };
    return { color: "bg-red-500", text: "Poor" };
  };

  const status = getCoverageStatus(percentage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Type Coverage Results
        </h3>
        <Badge variant="outline">
          {percentage.toFixed(1)}% Coverage
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Overall Coverage</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{percentage.toFixed(1)}%</span>
              <Badge variant="secondary" className={`${status.color} text-white`}>
                {status.text}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${status.color}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-2">Lines Analyzed</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Total Lines:</span>
              <span className="font-mono">{totalLines.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Covered Lines:</span>
              <span className="font-mono text-green-600">{coveredLines.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Uncovered Lines:</span>
              <span className="font-mono text-red-600">{(totalLines - coveredLines).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-2">Coverage Impact</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Missing Coverage:</span>
              <span className="font-mono">{(100 - percentage).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Points Deducted:</span>
              <span className="font-mono text-red-600">
                {((100 - percentage) * 10).toFixed(0)} pts
              </span>
            </div>
          </div>
        </Card>
      </div>

      {uncoveredFiles.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Files with Low Coverage</h4>
          <div className="space-y-1">
            {uncoveredFiles.slice(0, 10).map((file) => (
              <div key={file} className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {file}
              </div>
            ))}
            {uncoveredFiles.length > 10 && (
              <div className="text-sm text-muted-foreground mt-2">
                ... and {uncoveredFiles.length - 10} more files
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
