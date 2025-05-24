import type { Rubric } from "@/types/rubric";
import RubricView from "@/components/app/rubric-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PluginRubricTableProps {
  rubricData: Rubric;
  onUpdate?: (updatedRubric: Partial<Rubric>) => void;
}

export default function PluginRubricTable({
  rubricData,
  onUpdate,
}: PluginRubricTableProps) {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{rubricData.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <RubricView rubricData={rubricData} showPlugins editPlugin />
      </CardContent>
    </Card>
  );
}
