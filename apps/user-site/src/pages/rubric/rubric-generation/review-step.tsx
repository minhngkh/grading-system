import type { Rubric } from "@/types/rubric";
import RubricView from "@/components/app/rubric-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ExportDialog from "@/components/app/export-dialog";
import { RubricExporter } from "@/lib/exporters";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FinalRubricTableProps {
  rubricData: Rubric;
}

export default function FinalRubricTable({ rubricData }: FinalRubricTableProps) {
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{rubricData.rubricName}</CardTitle>
          <Button onClick={() => setExportOpen(true)}>Export</Button>
        </div>
        <CardDescription>
          Review the final rubric before submission. You can export it in various formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <RubricView rubricData={rubricData} showPlugins />
        {exportOpen && (
          <ExportDialog
            exporterClass={RubricExporter}
            args={[rubricData]}
            open={exportOpen}
            onOpenChange={setExportOpen}
          />
        )}
      </CardContent>
    </Card>
  );
}
