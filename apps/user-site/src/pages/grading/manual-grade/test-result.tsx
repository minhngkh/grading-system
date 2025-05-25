import { TestCase } from "@/types/submission";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface TestResultProps {
  content: TestCase[];
}

const TestResult = ({ content }: TestResultProps) => {
  const total = content.length;
  const passed = content.filter((row) => row.result === "Passed").length;
  const failed = total - passed;
  const passRate = Math.round((passed / total) * 100);

  return (
    <div className="w-full mx-auto space-y-6 p-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Total Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-500 dark:text-green-400">
              Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 dark:text-green-400">
              {passed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-500 dark:text-red-400">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500 dark:text-red-400">
              {failed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {passRate}%
            </div>
            <Progress value={passRate} className="h-2" />
          </CardContent>
        </Card>
      </div>
      <Table className="text-sm border border-gray-200 dark:border-gray-700">
        <TableCaption className="text-gray-600 dark:text-gray-400">
          Test Case Results Summary
        </TableCaption>
        <TableHeader className="bg-gray-100 dark:bg-gray-800">
          <TableRow>
            <TableHead className="font-bold text-gray-800 dark:text-gray-200">
              Test Case Id
            </TableHead>
            <TableHead className="font-bold text-gray-800 dark:text-gray-200">
              Expected
            </TableHead>
            <TableHead className="font-bold text-gray-800 dark:text-gray-200">
              Actual
            </TableHead>
            <TableHead className="font-bold text-center text-gray-800 dark:text-gray-200">
              Result
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {content.map((testCase, index) => {
            const isPass = testCase.result === "Passed";
            return (
              <TableRow
                key={index}
                className={`${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-900"
                    : "bg-gray-50 dark:bg-gray-800"
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                  {testCase.id}
                </TableCell>
                <TableCell className="text-gray-800 dark:text-gray-200">
                  {testCase.expected}
                </TableCell>
                <TableCell className="text-gray-800 dark:text-gray-200">
                  {testCase.actual}
                </TableCell>
                <TableCell className="text-center">
                  {isPass ? (
                    <Badge className="bg-green-500 hover:bg-green-600 dark:bg-green-400 dark:hover:bg-green-500">
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Pass
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-500">
                      <X className="h-3.5 w-3.5 mr-1" />
                      Fail
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TestResult;
