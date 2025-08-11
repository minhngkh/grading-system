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
  onEditPlugin: _onEditPlugin,
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
            // Check if this criterion uses an automated plugin (excluding AI)
            // AI plugins should show individual levels like manual grading
            const isAutomated =
              criterion.plugin &&
              criterion.plugin !== "None" &&
              criterion.plugin !== "ai";

            return (
              <tr key={criterion.name || criterionIndex} className="border-t">
                <td className="p-2 border-r">
                  <div className="font-medium">
                    {criterion.name} ({criterion.weight} %)
                  </div>
                </td>

                {
                  isAutomated ?
                    // For automated plugins (excluding AI): span across all level columns and show plugin name
                    <td
                      colSpan={rubricData.tags.length + (showPlugins ? 1 : 0)}
                      className="p-2 text-center"
                    >
                      <div className="flex flex-col justify-center items-center h-full">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-blue-400 text-lg">
                            {PluginName[criterion.plugin as keyof typeof PluginName] ||
                              "Unknown"}
                          </div>
                          {(!criterion.configuration || criterion.configuration.trim().length === 0) && (
                            <div className="text-orange-500">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Automated grading for this criterion
                        </div>
                      </div>
                    </td>
                    // For AI and manual plugins: show normal detailed levels
                  : <>
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
                          <div className={cn("text-center")}>
                            <div className="flex items-center justify-center gap-1">
                              <div className="font-semibold text-blue-400">
                                {criterion.plugin ?
                                  PluginName[criterion.plugin as keyof typeof PluginName] ||
                                  "Unknown"
                                : PluginName.ai}
                              </div>
                              {criterion.plugin && criterion.plugin !== "None" && (!criterion.configuration || criterion.configuration.trim().length === 0) && (
                                <div className="text-orange-500">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                    </>

                }
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
