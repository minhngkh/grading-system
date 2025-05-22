import type { Rubric } from "@/types/rubric";
import RubricView from "@/components/app/rubric-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditRubric from "./edit-rubric";

interface RubricTableProps {
  rubricData: Rubric;
  canEdit?: boolean;
  onUpdate?: (updatedRubric: Rubric) => void;
  showPlugins?: boolean;
  editPlugin?: boolean;
  disableEdit?: boolean;
  isApplyingEdit?: boolean;
}

export default function RubricTable({
  rubricData,
  onUpdate,
  canEdit = false,
  showPlugins = false,
  editPlugin = false,
  disableEdit = false,
  isApplyingEdit = false,
}: RubricTableProps) {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{rubricData.rubricName}</CardTitle>
          {canEdit && (
            <EditRubric
              rubricData={rubricData}
              onUpdate={onUpdate}
              disableEdit={disableEdit || isApplyingEdit}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className={canEdit ? "h-[85%]" : "flex-1"}>
        {isApplyingEdit ? (
          <div className="flex items-center justify-center h-full">
            Agent is applying edits to the rubric. Please wait...
          </div>
        ) : (
          <RubricView
            rubricData={rubricData}
            showPlugins={showPlugins}
            editPlugin={editPlugin}
          />
        )}
      </CardContent>
    </Card>
  );
}
