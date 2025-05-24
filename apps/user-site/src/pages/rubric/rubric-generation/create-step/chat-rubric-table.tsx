import type { Rubric } from "@/types/rubric";
import RubricView from "@/components/app/rubric-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditRubric from "./edit-rubric";
import Spinner from "@/components/app/spinner";

interface RubricTableProps {
  rubricData: Rubric;
  onUpdate?: (updatedRubric: Partial<Rubric>) => void;
  showPlugins?: boolean;
  editPlugin?: boolean;
  disableEdit?: boolean;
  isApplyingEdit?: boolean;
}

export default function ChatRubricTable({
  rubricData,
  onUpdate,
  showPlugins = false,
  editPlugin = false,
  disableEdit = false,
  isApplyingEdit = false,
}: RubricTableProps) {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{rubricData.name}</CardTitle>
          <EditRubric
            rubricData={rubricData}
            onUpdate={onUpdate}
            disableEdit={disableEdit || isApplyingEdit}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isApplyingEdit ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner />
            <p>Agent is modifying the rubric. Please wait...</p>
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
