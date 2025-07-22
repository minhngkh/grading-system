import type { Rubric } from "@/types/rubric";
import { RubricView } from "@/components/app/rubric-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExportDialog } from "@/components/app/export-dialog";
import { RubricExporter } from "@/lib/exporters";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpenCheck, FileUp } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface FinalRubricTableProps {
  rubricData: Rubric;
}

export default function FinalRubricTable({ rubricData }: FinalRubricTableProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Card className="w-full flex flex-col">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{rubricData.rubricName}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setExportOpen(true)}>
              <FileUp className="size-4" />
              Export
            </Button>
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() =>
                navigate({ to: "/gradings/create", search: { rubricId: rubricData.id } })
              }
            >
              <BookOpenCheck className="size-4" />
              Grade Now
            </Button>
          </div>
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
