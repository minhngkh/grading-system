import { useMemo, useState } from "react";

import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Check,
  CircleAlert,
  FileSearch,
  Info,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { PluginMetadataDialog } from "@/components/app/plugin-metadata";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ResultCardSkeleton } from "@/pages/grading/grading-result/skeletons";
import { rerunAssessmentMutationOptions } from "@/queries/assessment-queries";
import {
  type Assessment,
  AssessmentState,
  ScoreBreakdownStatus,
} from "@/types/assessment";
import { getCriteriaColorStyle } from "./colors";

interface AssessmentResultCardProps {
  item: Assessment;
  scaleFactor: number;
  criteriaColorMap: Record<string, { text: string; bg: string }>;
}

const getCardClassName = (state: AssessmentState) => {
  if (state === AssessmentState.AutoGradingFailed) {
    return "overflow-hidden py-0 border-red-200 dark:border-red-800";
  }

  if (state === AssessmentState.Completed) {
    return "overflow-hidden py-0 border-green-200 dark:border-green-800";
  }

  if (state === AssessmentState.AutoGradingStarted || state === AssessmentState.Created) {
    return "overflow-hidden py-0 border-blue-200 dark:border-blue-800";
  }

  if (
    state === AssessmentState.AutoGradingFinished ||
    state === AssessmentState.ManualGradingRequired
  ) {
    return "overflow-hidden py-0 border-orange-200 dark:border-orange-800";
  }

  return "overflow-hidden py-0";
};
export function AssessmentResultCard({
  item,
  scaleFactor,
  criteriaColorMap,
}: AssessmentResultCardProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [pluginMetadataOpen, setPluginMetadataOpen] = useState(false);
  const [selectedCriterion, setSelectedCriterion] = useState<{
    name: string;
    pluginType: string;
    metadata: unknown;
  } | null>(null);

  const { isPending: isRerunning, mutate: rerunAssessment } = useMutation(
    rerunAssessmentMutationOptions(auth, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["gradingAttempts"],
        });

        queryClient.invalidateQueries({
          queryKey: ["assessment", item.id],
        });
      },
      onError: (error) => {
        console.error("Failed to rerun assessment:", error);
        toast.error(
          `Failed to rerun assessment: ${item.submissionReference}. Please try again.`,
        );
      },
    }),
  );

  const isGradingFailed = item.status === AssessmentState.AutoGradingFailed;

  const sortedScoreBreakdowns = useMemo(() => {
    return item.scoreBreakdowns.sort((a, b) => {
      return a.criterionName.localeCompare(b.criterionName);
    });
  }, [item.scoreBreakdowns]);

  // Helper function to determine plugin type from metadata
  const getPluginType = (
    metadata?: string[] | Record<string, unknown>,
  ): string | null => {
    if (!metadata) return null;

    if (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)) {
      return (metadata as any).plugin || null;
    }

    if (Array.isArray(metadata) && metadata.length > 0) {
      try {
        const parsed = JSON.parse(metadata[0]);
        return parsed.plugin || null;
      } catch {
        return null;
      }
    }

    return null;
  };

  const hasValidMetadata = (metadata?: string[] | Record<string, unknown>): boolean => {
    if (!metadata) return false;

    if (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)) {
      return Object.keys(metadata).length > 0 && (metadata as any).plugin;
    }

    if (Array.isArray(metadata) && metadata.length > 0) {
      try {
        const parsed = JSON.parse(metadata[0]);
        return parsed.plugin && Object.keys(parsed).length > 0;
      } catch {
        return false;
      }
    }

    return false;
  };

  const parseMetadata = (metadata?: string[] | Record<string, unknown>): unknown => {
    if (!metadata) return null;

    if (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)) {
      return metadata;
    }

    if (Array.isArray(metadata) && metadata.length > 0) {
      try {
        return JSON.parse(metadata[0]);
      } catch {
        return metadata;
      }
    }

    return metadata;
  };

  const handleShowMetadata = (
    criterionName: string,
    metadata?: string[] | Record<string, unknown>,
  ) => {
    const pluginType = getPluginType(metadata);
    if (!pluginType) return;

    const parsedMetadata = parseMetadata(metadata);
    if (!parsedMetadata) return;

    setSelectedCriterion({
      name: criterionName,
      pluginType,
      metadata: parsedMetadata,
    });
    setPluginMetadataOpen(true);
  };

  if (item.status === AssessmentState.AutoGradingStarted) return <ResultCardSkeleton />;

  return (
    <Card className={getCardClassName(item.status)}>
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {item.submissionReference}
            </h3>
            {!isGradingFailed && (
              <span className="text-2xl font-bold">
                {((item.rawScore * scaleFactor) / 100).toFixed(2)} point(s)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm mb-4">
            {item.status === AssessmentState.AutoGradingFailed ?
              <>
                <p className="text-red-500">
                  Auto grading has failed. Require manual grading
                </p>
                <TriangleAlert className="size-3 text-red-500" />
              </>
            : item.status === AssessmentState.Completed ?
              <>
                <p className="text-green-500">Assessment Completed</p>
                <Check className="size-3 text-green-500" />
              </>
            : <>
                <p className="text-orange-500">Require manual grading</p>
                <CircleAlert className="size-3 text-orange-500" />
              </>
            }
          </div>

          <div className="space-y-3">
            {sortedScoreBreakdowns.map((score, index) => {
              const colorStyle = getCriteriaColorStyle(
                score.criterionName,
                criteriaColorMap,
              );

              const finalScore = ((score.rawScore * scaleFactor) / 100).toFixed(2);
              const pluginType = getPluginType(score.metadata);
              const hasMetadata = pluginType && hasValidMetadata(score.metadata);

              return (
                <div key={score.criterionName} className="mt-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className={colorStyle.text}>{score.criterionName}</span>
                      {hasMetadata && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            handleShowMetadata(score.criterionName, score.metadata)
                          }
                          title={`View ${pluginType} results`}
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {(
                      score.grader === "None" ||
                      score.status === ScoreBreakdownStatus.Manual
                    ) ?
                      <span className="text-orange-400">Require manual grading</span>
                    : score.status === ScoreBreakdownStatus.Failed ?
                      <span className="text-red-500">Failed to grade</span>
                    : <span className={colorStyle.text}>
                        {finalScore} ({score.rawScore}%)
                      </span>
                    }
                  </div>
                  {index !== item.scoreBreakdowns.length - 1 && (
                    <Separator className="mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-l flex md:flex-col justify-end p-4 bg-muted/40">
          <Button
            disabled={isRerunning}
            onClick={() => rerunAssessment(item.id)}
            variant="outline"
            className="flex items-center gap-2 mb-2 w-full"
          >
            <RefreshCw className="h-4 w-4" />
            Rerun
          </Button>
          <Link
            to="/gradings/$gradingId/assessments/$assessmentId"
            params={{ gradingId: item.gradingId, assessmentId: item.id }}
          >
            <Button className="flex items-center gap-2 w-full">
              <FileSearch className="h-4 w-4" />
              {isGradingFailed || item.status === AssessmentState.ManualGradingRequired ?
                "Manual"
              : "Review"}
            </Button>
          </Link>
        </div>
      </div>

      {selectedCriterion && (
        <PluginMetadataDialog
          open={pluginMetadataOpen}
          onOpenChange={setPluginMetadataOpen}
          pluginType={selectedCriterion.pluginType}
          metadata={selectedCriterion.metadata}
          criterionName={selectedCriterion.name}
        />
      )}
    </Card>
  );
}
