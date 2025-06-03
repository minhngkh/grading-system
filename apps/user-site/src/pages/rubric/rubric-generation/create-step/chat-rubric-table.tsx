import type { Rubric } from "@/types/rubric";
import RubricView from "@/components/app/rubric-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EditRubric from "@/components/app/edit-rubric";
import Spinner from "@/components/app/spinner";
import { useState } from "react";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RubricTableProps {
  rubricData: Rubric;
  onUpdate?: (updatedRubric: Partial<Rubric>) => void;
  disableEdit?: boolean;
  isApplyingEdit?: boolean;
}

export default function ChatRubricTable({
  rubricData,
  onUpdate,
  disableEdit = false,
  isApplyingEdit = false,
}: RubricTableProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{rubricData.rubricName}</CardTitle>
          <Button
            disabled={disableEdit || isApplyingEdit}
            onClick={() => setIsEditing(true)}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Edit the rubric manually or use AI to modify it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {isApplyingEdit ?
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner />
            <p>Agent is modifying the rubric. Please wait...</p>
          </div>
        : <div className="h-full overflow-y-auto relative">
            <div className="h-full absolute top-0 left-0 right-0">
              <RubricView rubricData={rubricData} />
            </div>
          </div>
        }
        {isEditing && (
          <EditRubric
            open={isEditing}
            onOpenChange={setIsEditing}
            rubricData={rubricData}
            onUpdate={onUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
}
