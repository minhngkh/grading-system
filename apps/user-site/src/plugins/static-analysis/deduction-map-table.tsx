import { Input } from "@/components/ui/input";
import { StaticAnalysisDeductionType } from "@/types/plugin";

interface DeductionMapTableProps {
  deductionMap: Partial<Record<StaticAnalysisDeductionType, number>>;
  onUpdateDeduction: (type: StaticAnalysisDeductionType, value: number) => void;
}

export default function DeductionMapTable({
  deductionMap,
  onUpdateDeduction,
}: DeductionMapTableProps) {
  const deductionTypes = Object.values(StaticAnalysisDeductionType);

  const handleDeductionChange = (type: StaticAnalysisDeductionType, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onUpdateDeduction(type, numValue);
    }
  };

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Deduction Rules</h4>
      <div className="border rounded-md">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Issue Type</th>
              <th className="p-3 text-left text-sm font-medium">Points Deducted</th>
            </tr>
          </thead>
          <tbody>
            {deductionTypes.map((type) => (
              <tr key={type} className="border-b last:border-b-0">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        type === StaticAnalysisDeductionType.critical ? "bg-red-500"
                        : type === StaticAnalysisDeductionType.error ? "bg-orange-500"
                        : type === StaticAnalysisDeductionType.warning ? "bg-yellow-500"
                        : "bg-blue-500"
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={deductionMap[type] || 0}
                    onChange={(e) => handleDeductionChange(type, e.target.value)}
                    className="w-20"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
