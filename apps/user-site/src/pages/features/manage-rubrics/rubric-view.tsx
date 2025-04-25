import type { Criteria, Rubric } from "@/types/rubric";
import { cn } from "@/lib/utils";

interface RubricViewProps {
  rubricData: Rubric;
}

export default function RubricView({ rubricData }: RubricViewProps) {
  const getMaxPoint = (criteria: Criteria) => {
    if (!criteria.levels.length) return 0;

    const highestLevel = criteria.levels.reduce((max, level) => {
      return level.points > max.points ? level : max;
    }, criteria.levels[0]);

    return highestLevel.points;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {rubricData.performanceTags.length > 0 && (
        <div className="border rounded-md overflow-auto h-full">
          <table className="w-full h-full table-fixed text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-2 border-r font-medium w-[150px]">
                  Criterion
                </th>
                {rubricData.performanceTags.map(
                  (header: string, index: number) => (
                    <th
                      key={index}
                      className={cn(
                        "text-center p-2 font-medium w-[150px]",
                        index !== rubricData.performanceTags.length - 1
                          ? "border-r"
                          : ""
                      )}>
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rubricData.criteria.map((criterion, index) => {
                return (
                  <tr key={index} className="border-t">
                    <td className="p-2 border-r">
                      <div className="font-medium">
                        {criterion.name} ({getMaxPoint(criterion)} pts)
                      </div>
                    </td>
                    {rubricData.performanceTags.map((tag, index) => {
                      const criterionLevel = criterion.levels.find(
                        (level) => level.performanceTag === tag
                      );

                      return (
                        <td
                          key={index}
                          className={cn(
                            "p-2 text-sm",
                            index !== rubricData.performanceTags.length - 1
                              ? "border-r"
                              : ""
                          )}>
                          {criterionLevel ? criterionLevel.description : ""}
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
    </div>
  );
}
