import type { Rubric } from "@/types/rubric";
import RubricView from "@/components/rubric-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditRubric from "./edit-rubric";

interface RubricTableProps {
  rubricData: Rubric;
  canEdit?: boolean;
  onUpdate?: (updatedRubric: Rubric) => void;
}

export default function RubricTable({
  rubricData,
  onUpdate,
  canEdit = true,
}: RubricTableProps) {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{rubricData.rubricName} Rubric</CardTitle>
          {canEdit && <EditRubric rubricData={rubricData} onUpdate={onUpdate} />}
        </div>
      </CardHeader>
      <CardContent className={canEdit ? "h-[85%]" : "flex-1"}>
        <RubricView rubricData={rubricData} />
      </CardContent>
    </Card>
  );
}
