import { useEffect, useState, useCallback } from "react";
import { Assessment } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import { toast } from "sonner";
import { ScoringPanel } from "@/components/app/scoring-panel";
import MainWorkspace from "@/components/app/main-workspace";
import { AssessmentHeader } from "@/components/app/assessment-header";
import useAssessmentForm from "@/hooks/use-assessment-form";
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
  const queryClient = useQueryClient();

  const { form, formData, validationState, updateLastSavedData, revertToLastSaved } =
    useAssessmentForm(assessment);

  const { canRevert, hasUnsavedChanges } = validationState;

  // Simple revert function
  const handleRevert = useCallback(() => {
    revertToLastSaved();
    toast.success("Reverted to saved data.");
  }, [revertToLastSaved]);

  // Only essential state
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [activeScoringTab, setActiveScoringTab] = useState<string>(
    rubric.criteria[0]?.name || "",
  );

  // Memoize callbacks to prevent unnecessary re-renders
  const handleFileSelect = useCallback((file: any) => {
    setSelectedFile(file);
  }, []);

  // Simple mutations without complex callbacks (like rubric page)
  const updateFeedbackMutation = useMutation(
    updateFeedbackMutationOptions(assessment.id, auth, {
      onSuccess: () => {
        toast.success("Feedback updated successfully");
        queryClient.invalidateQueries({ queryKey: ["assessment", assessment.id] });
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
        queryClient.invalidateQueries({
          queryKey: ["allGradingAssessments", grading.id],
        });
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
    }
  }, [isLoadingFiles, fileItems, fileLoadError]);

  const handleUpdateScore = useCallback(
    (criterionName: string, newScore: number) => {
      const criterion = rubric.criteria.find((c) => c.name === criterionName);
      if (!criterion) {
        console.warn(`Criterion not found: ${criterionName}`);
        return;
      }

      // Validate score range
      if (newScore < 0 || newScore > 100) {
        toast.error("Score must be between 0 and 100");
        return;
      }

      // Find the appropriate performance level
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

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Header */}
      <AssessmentHeader
        assessment={formData}
        grading={grading}
        rubric={rubric}
        canRevert={canRevert}
        hasUnsavedChanges={hasUnsavedChanges}
        handleRevert={handleRevert}
        updateLastSavedData={updateLastSavedData}
      />

      {/* Main Content */}
      <div className="flex-1 border rounded-md overflow-hidden">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel
            id="content"
            defaultSize={showBottomPanel ? 60 : 100}
            minSize={25}
          >
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
                onFileSelect={handleFileSelect}
                assessment={formData}
                grading={grading}
                rubric={rubric}
                activeScoringTab={activeScoringTab}
                form={form}
              />
            }
          </ResizablePanel>

          <div className="relative">
            {!showBottomPanel && (
              <ChevronsUp
                className="absolute bottom-1 left-1/2 -translate-x-1/2 h-6 w-6 text-foreground cursor-pointer z-50"
                onClick={() => setShowBottomPanel(true)}
              />
            )}
            {showBottomPanel && (
              <ChevronsDown
                className="absolute top-1 left-1/2 -translate-x-1/2 h-6 w-6 text-foreground cursor-pointer z-50 "
                onClick={() => setShowBottomPanel(false)}
              />
            )}
          </div>
          {showBottomPanel && (
            <>
              <ResizableHandle />
              <ResizablePanel id="scoring" defaultSize={40} minSize={20} maxSize={75}>
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
