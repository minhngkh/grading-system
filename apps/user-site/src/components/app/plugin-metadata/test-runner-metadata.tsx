import { CheckCircle, PlayCircle, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface TestCase {
  testCase: number;
  passed: boolean;
  input: string;
  output: string;
  expectedOutput: string;
}

interface TestRunnerMetadataType {
  feedback: TestCase[];
}

interface TestRunnerMetadataProps {
  metadata: TestRunnerMetadataType;
}

export function TestRunnerMetadata({ metadata }: TestRunnerMetadataProps) {
  const { feedback } = metadata;
  const passedCount = feedback.filter((tc) => tc.passed).length;
  const totalCount = feedback.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          Test Runner Results
        </h3>
        <Badge variant={passedCount === totalCount ? "default" : "destructive"}>
          {passedCount}/{totalCount} Passed
        </Badge>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {feedback.map((testCase) => (
          <Card key={testCase.testCase} className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-2 text-sm">
                  Test {testCase.testCase}
                  {testCase.passed ?
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  : <XCircle className="h-3 w-3 text-red-500" />}
                </span>
                <Badge
                  variant={testCase.passed ? "default" : "destructive"}
                  className="text-xs"
                >
                  {testCase.passed ? "PASS" : "FAIL"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="font-medium text-gray-600 mb-1">Input</div>
                  <code className="bg-muted px-2 py-1 rounded block truncate">
                    {testCase.input || "(empty)"}
                  </code>
                </div>
                <div>
                  <div className="font-medium text-gray-600 mb-1">Expected</div>
                  <code className="bg-muted px-2 py-1 rounded block truncate">
                    {testCase.expectedOutput}
                  </code>
                </div>
                <div>
                  <div className="font-medium text-gray-600 mb-1">Actual</div>
                  <code className="bg-muted px-2 py-1 rounded block truncate">
                    {testCase.output}
                  </code>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
