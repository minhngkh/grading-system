import type { Rubric } from "@/types/rubric";
import { cn } from "@/lib/utils";

interface RubricViewProps {
  rubricData: Rubric;
}

export default function RubricView({ rubricData }: RubricViewProps) {
  return (
    <>
      {rubricData.tags.length > 0 ? (
        <div className="border rounded-md overflow-auto h-full">
          <table className="w-full h-full table-fixed text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-2 border-r font-medium w-[150px]">
                  Criterion
                </th>
                {rubricData.tags.map((header: string, index: number) => (
                  <th
                    key={index}
                    className={cn(
                      "text-center p-2 font-medium w-[150px]",
                      index !== rubricData.tags.length - 1 ? "border-r" : "",
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
                    {rubricData.tags.map((tag, index) => {
                      const criterionLevel = criterion.levels.find(
                        (level) => level.tag === tag,
                      );

                      return (
                        <td
                          key={index}
                          className={cn(
                            "p-2 text-sm",
                            index !== rubricData.tags.length - 1
                              ? "border-r"
                              : "",
                          )}
                        >
                          {criterionLevel ? (
                            <div className="size-full whitespace-pre-line">
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
      ) : (
        <div className="p-4 size-full flex justify-center items-center">
          <div>This rubric is empty.</div>
        </div>
      )}
    </>
  );
}
