import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, RefreshCw, FileSearch } from "lucide-react";

// Define criteria types
type CriteriaName = "Content" | "Structure" | "Clarity" | "Analysis" | "References";

// Sample data structure
interface GradingCriteria {
  name: CriteriaName;
  percentage: number;
}

interface GradingItem {
  id: string;
  fileName: string;
  totalPercentage: number;
  criteria: GradingCriteria[];
}

// Define color styles
interface ColorStyle {
  text: string;
  bg: string;
}

// Define unique colors for each criteria with proper typing
const criteriaColors: Record<CriteriaName, ColorStyle> = {
  Content: { text: "text-purple-600", bg: "bg-purple-500" },
  Structure: { text: "text-blue-600", bg: "bg-blue-500" },
  Clarity: { text: "text-green-600", bg: "bg-green-500" },
  Analysis: { text: "text-amber-600", bg: "bg-amber-500" },
  References: { text: "text-rose-600", bg: "bg-rose-500" },
};

// Function to safely get color style with fallback
const getCriteriaColorStyle = (name: string): ColorStyle => {
  // Type assertion to check if the name is a valid CriteriaName
  if (Object.keys(criteriaColors).includes(name)) {
    return criteriaColors[name as CriteriaName];
  }
  // Default fallback color if not found
  return { text: "text-gray-600", bg: "bg-gray-500" };
};

// Sample data with consistent criteria
const initialGradingItems: GradingItem[] = [
  {
    id: "1",
    fileName: "assignment1.pdf",
    totalPercentage: 85,
    criteria: [
      { name: "Content", percentage: 90 },
      { name: "Structure", percentage: 80 },
      { name: "Clarity", percentage: 85 },
      { name: "Analysis", percentage: 82 },
      { name: "References", percentage: 88 },
    ],
  },
  {
    id: "2",
    fileName: "project_report.docx",
    totalPercentage: 92,
    criteria: [
      { name: "Content", percentage: 95 },
      { name: "Structure", percentage: 90 },
      { name: "Clarity", percentage: 92 },
      { name: "Analysis", percentage: 94 },
      { name: "References", percentage: 89 },
    ],
  },
  {
    id: "3",
    fileName: "final_essay.pdf",
    totalPercentage: 78,
    criteria: [
      { name: "Content", percentage: 75 },
      { name: "Structure", percentage: 80 },
      { name: "Clarity", percentage: 78 },
      { name: "Analysis", percentage: 76 },
      { name: "References", percentage: 81 },
    ],
  },
  {
    id: "4",
    fileName: "code_submission.zip",
    totalPercentage: 88,
    criteria: [
      { name: "Content", percentage: 92 },
      { name: "Structure", percentage: 85 },
      { name: "Clarity", percentage: 88 },
      { name: "Analysis", percentage: 90 },
      { name: "References", percentage: 85 },
    ],
  },
];

export default function ResultsStep() {
  const [gradingItems] = useState<GradingItem[]>(initialGradingItems);

  // Calculate summary statistics
  const averageScore = Math.round(
    gradingItems.reduce((sum, item) => sum + item.totalPercentage, 0) /
      gradingItems.length,
  );

  const highestScore = Math.max(...gradingItems.map((item) => item.totalPercentage));
  const lowestScore = Math.min(...gradingItems.map((item) => item.totalPercentage));

  // Placeholder functions for buttons
  const handleRerun = (id: string) => {
    alert(`Rerunning grading for item ${id}`);
  };

  const handleReview = (id: string) => {
    alert(`Opening review for item ${id}`);
  };

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium text-blue-600">Average Score</span>
                <span className="text-3xl font-bold text-blue-600">{averageScore}%</span>
                <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${averageScore}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium text-green-600">Highest Score</span>
                <span className="text-3xl font-bold text-green-600">{highestScore}%</span>
                <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${highestScore}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium text-red-600">Lowest Score</span>
                <span className="text-3xl font-bold text-red-600">{lowestScore}%</span>
                <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-red-600 h-2.5 rounded-full"
                    style={{ width: `${lowestScore}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Total items graded: {gradingItems.length}
            </div>
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Summary Report</h3>
              <p className="text-sm text-muted-foreground">
                The grading process has been completed for {gradingItems.length}{" "}
                submissions with an average score of{" "}
                <span className="font-bold text-blue-600">{averageScore}%</span>. The
                highest performing submission achieved{" "}
                <span className="font-bold text-green-600">{highestScore}%</span>, while
                the lowest score was{" "}
                <span className="font-bold text-red-600">{lowestScore}%</span>.
                {averageScore >= 85
                  ? " Overall, the submissions demonstrate excellent understanding of the material with strong performance across most criteria."
                  : averageScore >= 75
                    ? " Overall, the submissions show good understanding of the material with satisfactory performance across most criteria."
                    : " Overall, the submissions indicate areas where additional support may be needed to improve understanding of key concepts."}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {gradingItems.filter((item) => item.totalPercentage >= 90).length > 0
                  ? `${gradingItems.filter((item) => item.totalPercentage >= 90).length} submissions achieved outstanding scores of 90% or above. `
                  : ""}
                {gradingItems.filter((item) => item.totalPercentage < 70).length > 0
                  ? `${gradingItems.filter((item) => item.totalPercentage < 70).length} submissions scored below 70% and may require additional review. `
                  : ""}
                Consider reviewing the detailed breakdown of each submission to identify
                specific areas for improvement.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* List Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Grading Results</h2>
        <div className="space-y-4">
          {gradingItems.map((item) => (
            <Card key={item.id} className="overflow-hidden py-0">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {item.fileName}
                    </h3>
                    <span className="text-2xl font-bold">{item.totalPercentage}%</span>
                  </div>

                  <div className="space-y-3">
                    {item.criteria.map((criterion, index) => {
                      const colorStyle = getCriteriaColorStyle(criterion.name);
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className={colorStyle.text}>{criterion.name}</span>
                            <span className={colorStyle.text}>
                              {criterion.percentage}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colorStyle.bg}`}
                              style={{ width: `${criterion.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex md:flex-col justify-end p-4 bg-muted">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 mb-2 w-full"
                    onClick={() => handleRerun(item.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Rerun
                  </Button>
                  <Button
                    className="flex items-center gap-2 w-full"
                    onClick={() => handleReview(item.id)}
                  >
                    <FileSearch className="h-4 w-4" />
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
