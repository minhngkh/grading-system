import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, FileSearch } from "lucide-react";
import { getCriteriaColorStyle } from "./grading-colors";
import { Skeleton } from "@/components/ui/skeleton";

const ResultCardSkeleton = () => (
  <Card className="overflow-hidden py-0">
    <div className="flex flex-col md:flex-row">
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex md:flex-col justify-end p-4 bg-muted gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  </Card>
);

type ReviewResultsProps = {
  isLoading: boolean;
  mappedAssessments: {
    id: string;
    fileName: string;
    totalPercentage: number;
    criteria: {
      name: string;
      percentage: number;
    }[];
  }[];
};

export default function ReviewResults({
  isLoading,
  mappedAssessments,
}: ReviewResultsProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Grading Results</h2>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Rerun All
        </Button>
      </div>
      {isLoading ? (
        <ResultCardSkeleton />
      ) : (
        <div className="space-y-4">
          {mappedAssessments.map((item) => (
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
                  >
                    <RefreshCw className="h-4 w-4" />
                    Rerun
                  </Button>
                  <Button className="flex items-center gap-2 w-full">
                    <FileSearch className="h-4 w-4" />
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
