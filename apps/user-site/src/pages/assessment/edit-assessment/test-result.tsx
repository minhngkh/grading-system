import type React from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export interface TestCase {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: "pass" | "fail" | "pending";
}

interface TestResultProps {
  testCases: TestCase[];
}

export const TestResult: React.FC<TestResultProps> = ({ testCases }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="h-full overflow-auto p-4">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
              Input
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
              Expected Output
            </th>
            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
              Actual Output
            </th>
            <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {testCases.map((testCase, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-gray-800">
                {testCase.input}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-gray-800">
                {testCase.expectedOutput}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-gray-800">
                {testCase.actualOutput || "No output"}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  {getStatusIcon(testCase.status)}
                  <span className="text-sm">{getStatusText(testCase.status)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {testCases.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No test cases available</p>
        </div>
      )}
    </div>
  );
};
