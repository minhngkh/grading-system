import type { Rubric } from "@/types/rubric";
import RubricView from "@/components/app/rubric-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExportDialog from "./export-dialog";

interface FinalRubricTableProps {
  rubricData: Rubric;
}

export default function FinalRubricTable({ rubricData }: FinalRubricTableProps) {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{rubricData.name}</CardTitle>
          <ExportDialog rubricData={rubricData} />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <RubricView rubricData={rubricData} showPlugins />
      </CardContent>
    </Card>
  );
}
