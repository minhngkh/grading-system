import { useState } from "react";
import type { Rubric } from "@/types/rubric";
import { cn } from "@/lib/utils";
import { PluginSelectDialog } from "./plugin-select-dialog";

interface RubricViewProps {
  rubricData: Rubric;
  showPlugins?: boolean;
  editPlugin?: boolean;
  onEditPlugin?: (updatedRubric: Partial<Rubric>) => void;
}

export default function RubricView({
  rubricData,
  showPlugins = false,
  editPlugin = false,
  onEditPlugin,
}: RubricViewProps) {
  if (rubricData.criteria.length === 0) {
    return (
      <div className="p-4 size-full flex justify-center items-center">
        <div>This rubric is empty.</div>
      </div>
    );
  }
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCriterionIndex, setSelectedCriterionIndex] = useState<number | null>(
    null,
  );

  const handlePluginSelect = (index: number, plugin: string) => {
    const updatedCriteria = rubricData.criteria.map((criterion, idx) => {
      if (idx === index) {
        return {
          ...criterion,
          plugin: criterion.plugin === plugin ? undefined : plugin,
        };
      }
      return criterion;
    });

    onEditPlugin?.({ criteria: updatedCriteria });
    setDialogOpen(false);
  };

  return (
    <div className="border rounded-md overflow-auto h-full">
      <table className="w-full h-full table-fixed text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-2 border-r font-medium w-[150px]">Criterion</th>
            {rubricData.tags.map((header: string, index: number) => (
              <th
                key={index}
                className={cn(
                  "text-center p-2 font-medium w-[150px]",
                  (showPlugins || index !== rubricData.tags.length - 1) && "border-r",
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
                        (showPlugins || index !== rubricData.tags.length - 1) &&
                          "border-r",
                      )}
                    >
                      {criterionLevel && (
                        <div className="whitespace-pre-line flex flex-col justify-center items-center h-full">
                          <div className="font-semibold text-blue-400 mb-1">
                            {criterionLevel.weight} %
                          </div>
                          <div>{criterionLevel.description}</div>
                        </div>
                      )}
                    </td>
                  );
                })}
                {showPlugins && (
                  <td
                    className={cn(
                      "p-2 text-sm",
                      editPlugin && "cursor-pointer hover:bg-muted/50",
                    )}
                    onClick={() => {
                      if (!editPlugin) return;
                      setSelectedCriterionIndex(index);
                      setDialogOpen(true);
                    }}
                  >
                    <div
                      className={cn(
                        "text-center font-semibold text-blue-400",
                        editPlugin && "underline cursor-pointer",
                      )}
                    >
                      {criterion.plugin || "AI (Default)"}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {selectedCriterionIndex !== null && dialogOpen && (
        <PluginSelectDialog
          criterion={rubricData.criteria[selectedCriterionIndex]}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSelect={handlePluginSelect}
        />
      )}
    </div>
  );
}
