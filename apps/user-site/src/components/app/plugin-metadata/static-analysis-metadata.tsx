import { AlertTriangle, FileX, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface StaticAnalysisMetadataType {
  ignoredFiles: string[];
}

interface StaticAnalysisMetadataProps {
  metadata: StaticAnalysisMetadataType;
}

export function StaticAnalysisMetadata({ metadata }: StaticAnalysisMetadataProps) {
  const { ignoredFiles } = metadata;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Static Analysis Results
        </h3>
        <Badge variant="outline">{ignoredFiles.length} Files Processed</Badge>
      </div>

      {ignoredFiles.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileX className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Analyzed Files</h4>
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {ignoredFiles.map((file) => (
              <div key={file} className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {file}
              </div>
            ))}
          </div>
        </Card>
      )}

      {ignoredFiles.length === 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">No files were analyzed</p>
          </div>
        </Card>
      )}
    </div>
  );
}
