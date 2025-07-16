import { useEffect, useState, useCallback } from "react";
import { Assessment } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import { toast } from "sonner";
import { ScoringPanel } from "@/components/app/scoring-panel";
import MainWorkspace from "@/components/app/main-workspace";
import { AssessmentHeader } from "@/components/app/assessment-header";
import { useAssessmentState } from "@/hooks/use-assessment-state";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import {
  updateFeedbackMutationOptions,
  updateScoreMutationOptions,
} from "@/queries/assessment-queries";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import { getFileItemsQueryOptions } from "@/queries/file-queries";

export function EditAssessmentUI({
  assessment,
  grading,
  rubric,
}: {
  assessment: Assessment;
  grading: GradingAttempt;
  rubric: Rubric;
}) {
  const auth = useAuth();

  const {
    form,
    formData,
    canRevert,

    updateLastSavedData,
    markCurrentAsValidated,
    resetToInitial,
  } = useAssessmentState(assessment);

  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [activeScoringTab, setActiveScoringTab] = useState<string>(
    rubric.criteria[0]?.name || "",
  );

  const queryClient = useQueryClient();
  const updateFeedbackMutation = useMutation(
    updateFeedbackMutationOptions(assessment.id, auth, {
      onSuccess: (_, feedbacks) => {
        toast.success("Feedback updated successfully");
        updateLastSavedData({ feedbacks });
      },
      onError: (error) => {
        console.error("Failed to update feedback:", error);
        toast.error("Failed to update feedback");
      },
    }),
  );

  const updateScoreMutation = useMutation(
    updateScoreMutationOptions(assessment.id, auth, {
      onSuccess: (_, scoreBreakdowns) => {
        toast.success("Score updated successfully");
        updateLastSavedData({
          scoreBreakdowns: scoreBreakdowns as Assessment["scoreBreakdowns"],
        });

        queryClient.invalidateQueries({ queryKey: ["assessment", assessment.id] });
        queryClient.invalidateQueries({ queryKey: ["gradingAssessments", grading.id] });
        queryClient.invalidateQueries({
          queryKey: ["scoreAdjustments", assessment.id],
        });
      },
      onError: (error) => {
        console.error("Failed to update score:", error);
        toast.error("Failed to update score");
      },
    }),
  );

  const {
    data: fileItems,
    isFetching: isLoadingFiles,
    error: fileLoadError,
  } = useQuery(getFileItemsQueryOptions(grading.id, formData.submissionReference, auth));

  useEffect(() => {
    if (isLoadingFiles) return;
    if (fileLoadError) return;

    if (fileItems && fileItems.length > 0) {
      setFiles(fileItems);
      setSelectedFile(fileItems[0]);
      markCurrentAsValidated();
    }
  }, [isLoadingFiles, fileItems, fileLoadError]);

  const handleUpdateScore = useCallback(
    (criterionName: string, newScore: number) => {
      const criterion = rubric.criteria.find((c) => c.name === criterionName);
      if (!criterion) {
        console.warn(`Criterion not found: ${criterionName}`);
        return;
      }

      if (newScore < 0 || newScore > 100) {
        toast.error("Score must be between 0 and 100");
        return;
      }

      let matchedLevel = criterion.levels
        .filter((l) => l.weight <= newScore)
        .sort((a, b) => b.weight - a.weight)[0];

      if (!matchedLevel && criterion.levels.length > 0) {
        matchedLevel = criterion.levels.reduce(
          (min, l) => (l.weight < min.weight ? l : min),
          criterion.levels[0],
        );
      }

      const updated = formData.scoreBreakdowns.map((sb: any) =>
        sb.criterionName === criterionName ?
          {
            ...sb,
            performanceTag: matchedLevel ? matchedLevel.tag : "",
            rawScore: (newScore * (criterion.weight ?? 0)) / 100,
          }
        : sb,
      );

      form.setValue("scoreBreakdowns", updated, { shouldValidate: true });
    },
    [rubric.criteria, formData.scoreBreakdowns, form],
  );

  const handleSaveFeedback = async () => {
    if (updateFeedbackMutation.isPending) return;
    updateFeedbackMutation.mutateAsync(formData.feedbacks);
  };

  const handleSaveScore = async () => {
    if (updateScoreMutation.isPending) return;
    updateScoreMutation.mutateAsync(formData.scoreBreakdowns);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (!updateFeedbackMutation.isPending) {
          handleSaveFeedback();
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "S") {
        event.preventDefault();
        if (!updateScoreMutation.isPending) {
          handleSaveScore();
        }
      }

      if (event.key === "Escape") {
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    updateFeedbackMutation.isPending,
    updateScoreMutation.isPending,
    handleSaveFeedback,
    handleSaveScore,
  ]);

  return (
    <div className="h-full relative flex flex-col bg-background text-foreground overflow-hidden space-y-4">
      <AssessmentHeader
        form={form}
        assessment={formData}
        grading={grading}
        rubric={rubric}
        canRevert={canRevert}
        handleRevert={() => {
          resetToInitial();
          toast.success("Reverted to saved data.");
        }}
        updateLastSavedData={updateLastSavedData}
      />

      <div className="border rounded-md overflow-hidden flex-1">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={showBottomPanel ? 60 : 100} minSize={25}>
            {isLoadingFiles ?
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading files...</p>
                </div>
              </div>
            : fileLoadError ?
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-sm text-destructive mb-2">Error loading files</p>
                  <p className="text-xs text-muted-foreground">{fileLoadError.message}</p>
                </div>
              </div>
            : <MainWorkspace
                files={files}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                assessment={formData}
                grading={grading}
                rubric={rubric}
                activeScoringTab={activeScoringTab}
                form={form}
              />
            }
          </ResizablePanel>

          {!showBottomPanel && (
            <ChevronsUp
              className="absolute bottom-3 left-1/2 transform -translate-x-1/2 h-6 w-6 text-foreground cursor-pointer z-50"
              onClick={() => setShowBottomPanel(true)}
            />
          )}
          {showBottomPanel && (
            <div className="relative">
              <ChevronsDown
                className="absolute bottom-2 left-1/2 transform -translate-x-1/2 h-6 w-6 text-foreground cursor-pointer z-50 "
                onClick={() => setShowBottomPanel(false)}
              />
            </div>
          )}
          {showBottomPanel && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={40} minSize={30} maxSize={75}>
                <ScoringPanel
                  rubric={rubric}
                  grading={grading}
                  formData={formData}
                  updateScore={handleUpdateScore}
                  assessmentId={assessment.id}
                  activeScoringTab={activeScoringTab}
                  setActiveScoringTab={setActiveScoringTab}
                  form={form}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
