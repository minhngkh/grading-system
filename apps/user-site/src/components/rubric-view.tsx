import { useState } from "react";
import type { Rubric } from "@/types/rubric";
import { cn } from "@/lib/utils";
import { PluginSelectDialog } from "./plugin-select-dialog";

interface RubricViewProps {
  rubricData: Rubric;
  showPlugins?: boolean;
  editPlugin?: boolean;
}

export default function RubricView({
  rubricData,
  showPlugins = false,
  editPlugin = false,
}: RubricViewProps) {
  const [selectedPlugins, setSelectedPlugins] = useState<Record<number, string>>({}); // key is criterion index
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeCriterionIndex, setActiveCriterionIndex] = useState<number | null>(null);

  const handlePluginSelect = (plugin: string) => {
    if (activeCriterionIndex !== null) {
      setSelectedPlugins((prev) => ({
        ...prev,
        [activeCriterionIndex]: plugin,
      }));
      setDialogOpen(false);
    }
  };

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
                      index !== rubricData.tags.length - 1 || (showPlugins && "border-r"),
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
                            index !== rubricData.tags.length - 1 ||
                              (showPlugins && "border-r"),
                          )}
                        >
                          {criterionLevel && (
                            <div className="whitespace-pre-line flex flex-col justify-center items-center h-full">
                              <div className="font-semibold text-blue-400 mb-1">
                                {criterionLevel.weight} %
                              </div>
                              <div className="text-center">
                                {criterionLevel.description}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {showPlugins && (
                      <td
                        className="p-2 text-sm cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (!editPlugin) return;
                          setActiveCriterionIndex(index);
                          setDialogOpen(true);
                        }}
                      >
                        <div
                          className={cn(
                            "text-center text-blue-400 font-semibold dark:text-blue-500",
                            editPlugin && "underline cursor-pointer",
                          )}
                        >
                          {selectedPlugins[index] || "AI"}
                        </div>
                      </td>
                    )}
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

      <PluginSelectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={handlePluginSelect}
      />
    </>
  );
}
