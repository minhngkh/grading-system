import type { Rubric } from "@/types/rubric";
import { PluginName } from "@/consts/plugins";
import { cn } from "@/lib/utils";

interface RubricViewProps {
  rubricData: Rubric;
  showPlugins?: boolean;
  editPlugin?: boolean;
  onEditPlugin?: (updatedRubric: Partial<Rubric>) => void;
}

export function RubricView({
  rubricData,
  showPlugins = false,
  editPlugin: _editPlugin,
  onEditPlugin: _onEditPlugin
}: RubricViewProps) {
  if (rubricData.criteria.length === 0) {
    return (
      <div className="text-muted-foreground size-full flex justify-center items-center">
        <div>This rubric is empty.</div>
      </div>
    );
  }

  // Show hybrid rubric view - normal structure but simplified rows for automated plugins
  return (
    <div className="border rounded-md h-full">
      <table className="w-full h-full table-fixed text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-2 border-r font-medium w-[150px]">Criterion</th>
            {rubricData.tags.map((header: string, tagIndex: number) => (
              <th
                key={`tag-${header}`}
                className={cn(
                  "text-center p-2 font-medium w-[150px]",
                  (showPlugins || tagIndex !== rubricData.tags.length - 1) && "border-r",
                )}
              >
                {header}
              </th>
            ))}
            {showPlugins && (
              <th className="text-center p-2 font-medium w-[100px]">Plugin</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rubricData.criteria.map((criterion, criterionIndex) => {
            // Check if this criterion uses an automated plugin
            const isAutomated = criterion.plugin && 
              criterion.plugin !== "ai" && 
              criterion.plugin !== "None";

            return (
              <tr key={criterion.name || criterionIndex} className="border-t">
                <td className="p-2 border-r">
                  <div className="font-medium">
                    {criterion.name} ({criterion.weight} %)
                  </div>
                </td>
                
                {isAutomated ? (
                  // For automated plugins: span across all level columns and show plugin name
                  <td 
                    colSpan={rubricData.tags.length + (showPlugins ? 1 : 0)}
                    className="p-2 text-center"
                  >
                    <div className="flex flex-col justify-center items-center h-full">
                      <div className="font-semibold text-blue-400 text-lg">
                        {PluginName[criterion.plugin as keyof typeof PluginName] || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Automated grading for this criterion
                      </div>
                    </div>
                  </td>
                ) : (
                  // For AI/manual plugins: show normal detailed levels
                  <>
                    {rubricData.tags.map((tag, tagIndex) => {
                      const criterionLevel = criterion.levels.find(
                        (level) => level.tag === tag,
                      );

                      return (
                        <td
                          key={`${criterion.name}-${tag}`}
                          className={cn(
                            "p-2 text-sm",
                            (showPlugins || tagIndex !== rubricData.tags.length - 1) &&
                              "border-r",
                          )}
                        >
                          {criterionLevel && (
                            <div className="whitespace-pre-line flex flex-col justify-center items-center h-full">
                              <div className="font-semibold text-blue-400 mb-1">
                                {criterionLevel.weight} %
                              </div>
                              <div className="flex-1">{criterionLevel.description}</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {showPlugins && (
                      <td className={cn("p-2 text-sm")}>
                        <div className={cn("text-center font-semibold text-blue-400")}>
                          {criterion.plugin ?
                            PluginName[criterion.plugin as keyof typeof PluginName] ||
                            "Unknown"
                          : PluginName.ai}
                        </div>
                      </td>
                    )}
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
