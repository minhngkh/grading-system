import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

interface AdditionalRulesetsTableProps {
  rulesets: string[];
  onAddRuleset: (ruleset: string) => void;
  onRemoveRuleset: (index: number) => void;
}

export default function AdditionalRulesetsTable({
  rulesets,
  onAddRuleset,
  onRemoveRuleset,
}: AdditionalRulesetsTableProps) {
  const [newRuleset, setNewRuleset] = useState("");

  const handleAddRuleset = () => {
    if (newRuleset.trim()) {
      onAddRuleset(newRuleset.trim());
      setNewRuleset("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddRuleset();
    }
  };

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Additional Rulesets</h4>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Enter ruleset name (e.g., security, performance)"
            value={newRuleset}
            onChange={(e) => setNewRuleset(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRuleset}
            disabled={!newRuleset.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {rulesets.length > 0 && (
          <div className="border rounded-md">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium">Ruleset</th>
                  <th className="p-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rulesets.map((ruleset, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="p-3">
                      <span className="text-sm">{ruleset}</span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveRuleset(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rulesets.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground border rounded-md border-dashed">
            No additional rulesets configured
          </div>
        )}
      </div>
    </div>
  );
}
