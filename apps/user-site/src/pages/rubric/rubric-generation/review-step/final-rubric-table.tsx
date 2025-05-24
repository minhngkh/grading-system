import type { Rubric } from "@/types/rubric";
import RubricView from "@/components/app/rubric-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ExportDialog from "./export-dialog";

interface FinalRubricTableProps {
  rubricData: Rubric;
}

export default function FinalRubricTable({ rubricData }: FinalRubricTableProps) {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{rubricData.rubricName}</CardTitle>
          <ExportDialog rubricData={rubricData} />
        </div>
        <CardDescription>
          Review the final rubric before submission. You can export it in various formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <RubricView rubricData={rubricData} showPlugins />
      </CardContent>
    </Card>
  );
}
