import { CheckCircle, PlayCircle, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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

  // Helper function to determine if content should be displayed as textarea
  const shouldUseTextarea = (content: string) => {
    return content.includes("\n") || content.length > 50;
  };

  // Helper function to render content based on length/format
  const renderContent = (content: string, placeholder: string = "(empty)") => {
    const displayContent = content || placeholder;

    if (shouldUseTextarea(displayContent)) {
      return (
        <Textarea
          value={displayContent}
          readOnly
          className="min-h-[60px] max-h-[120px] text-xs font-mono resize-none"
        />
      );
    }

    return (
        <Textarea
          value={displayContent}
          readOnly
          className="min-h-[10px] max-h-[120px] text-xs font-mono resize-none"
        />
      );

    // return (
    //   <code className="border px-2 py-1 block truncate text-xs border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 rounded-md">
    //     {displayContent}
    //   </code>
    // );
  };

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

      <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
        {feedback.map((testCase) => (
          <Card key={testCase.testCase} className="p-4 gap-2">
            {/* Test header with title and status on same line */}
            <div className="flex items-center justify-between mb-0 pb-2 border-b border-gray-200">
              <h4 className="font-semibold text-base">Test {testCase.testCase}</h4>
              <div className="flex items-center gap-2">
                {testCase.passed ?
                  <CheckCircle className="h-4 w-4 text-green-500" />
                : <XCircle className="h-4 w-4 text-red-500" />}
                <Badge
                  variant={testCase.passed ? "default" : "destructive"}
                  className="text-xs"
                >
                  {testCase.passed ? "PASS" : "FAIL"}
                </Badge>
              </div>
            </div>

            {/* Content in 3 columns for more space */}
            <div className="grid grid-cols-3 gap-6 items-start">
              {/* Input column */}
              <div>
                <div className="font-medium text-gray-600 mb-2 text-sm">Input</div>
                {renderContent(testCase.input, "(empty)")}
              </div>

              {/* Expected output column */}
              <div>
                <div className="font-medium text-gray-600 mb-2 text-sm">Expected</div>
                {renderContent(testCase.expectedOutput)}
              </div>

              {/* Actual output column */}
              <div>
                <div className="font-medium text-gray-600 mb-2 text-sm">Actual</div>
                {renderContent(testCase.output)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
