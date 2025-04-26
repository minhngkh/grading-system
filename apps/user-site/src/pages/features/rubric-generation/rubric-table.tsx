import type { Rubric } from "@/types/rubric";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
          {canEdit && onUpdate && (
            <EditRubric rubricData={rubricData} onUpdate={onUpdate} />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {rubricData.performanceTags.length > 0 && (
          <div className="border rounded-md overflow-auto h-full">
            <table className="w-full h-full table-fixed text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 border-r font-medium w-[150px]">
                    Criterion
                  </th>
                  {rubricData.performanceTags.map((header: string, index: number) => (
                    <th
                      key={index}
                      className={cn(
                        "text-center p-2 font-medium w-[150px]",
                        index !== rubricData.performanceTags.length - 1 ? "border-r" : "",
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rubricData.criteria.map((criterion, index) => {
                  return (
                    <tr key={index} className="border-t">
                      <td className="p-2 border-r">
                        <div className="font-medium">
                          {criterion.name} ({criterion.weight} %)
                        </div>
                      </td>
                      {rubricData.performanceTags.map((tag, index) => {
                        const criterionLevel = criterion.levels.find(
                          (level) => level.performanceTag === tag,
                        );

                        return (
                          <td
                            key={index}
                            className={cn(
                              "p-2 text-sm",
                              index !== rubricData.performanceTags.length - 1
                                ? "border-r"
                                : "",
                            )}
                          >
                            {criterionLevel ? (
                              <div className="size-full">
                                <div className="font-semibold text-blue-400 mb-1">
                                  {criterionLevel.weight} %
                                </div>
                                {criterionLevel.description}
                              </div>
                            ) : (
                              ""
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
