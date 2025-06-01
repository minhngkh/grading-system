import type { Rubric } from "@/types/rubric";
import RubricView from "@/components/app/rubric-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        <CardTitle className="text-lg">{rubricData.rubricName}</CardTitle>
        <CardDescription>
          Configure the tools used for grading each criterion. If you need to edit a
          plugin, click on the plugin name to select a different one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <RubricView
          rubricData={rubricData}
          showPlugins
          editPlugin
          onEditPlugin={onUpdate}
        />
      </CardContent>
    </Card>
  );
}
