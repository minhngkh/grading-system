import { useEffect, useState, useCallback } from "react";
import { Assessment } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import { toast } from "sonner";
import { ScoringPanel } from "@/components/app/scoring-panel";
import { FileService } from "@/services/file-service";
import MainWorkspace from "@/components/app/main-workspace";
import { AssessmentHeader } from "@/components/app/assessment-header";
import useAssessmentForm from "@/hooks/use-assessment-form";
import {
  useMutation,
  useQueryClient,
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import {
  updateFeedbackMutationOptions,
  updateScoreMutationOptions,
  getAssessmentQueryOptions,
} from "@/queries/assessment-queries";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ChevronsDown, ChevronsUp } from "lucide-react";

export function EditAssessmentUI({
  assessment: initialAssessment,
  grading,
  rubric,
}: {
  assessment: Assessment;
  grading: GradingAttempt;
  rubric: Rubric;
}) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  // Simple useQuery pattern like rubric page
  const { data: assessment } = useQuery({
    ...getAssessmentQueryOptions(initialAssessment.id, auth),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Use latest data or fallback to initial
  const currentAssessment = assessment || initialAssessment;

  const {
    form,
    formData,
    validationState,
    updateLastSavedData,
    revertToLastSaved,
  } = useAssessmentForm(currentAssessment);

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
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);

  // Simple mutations without complex callbacks (like rubric page)
  const updateFeedbackMutation = useMutation(
    updateFeedbackMutationOptions(currentAssessment.id, auth),
  );

  const updateScoreMutation = useMutation(
    updateScoreMutationOptions(currentAssessment.id, auth),
  );

  // Load files with proper error handling and loading states
  useEffect(() => {
    async function loadFiles() {
      if (!formData.submissionReference) return;

      setIsLoadingFiles(true);
      setFileLoadError(null);

      try {
        const items = await FileService.loadFileItems(
          `${grading.id}/${formData.submissionReference}`,
        );
        setFiles(items || []);
      } catch (error) {
        console.error("Error loading files:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load files";
        setFileLoadError(errorMessage);
        setFiles([]);
        toast.error(errorMessage);
      } finally {
        setIsLoadingFiles(false);
      }
    }

    loadFiles();
  }, [formData.submissionReference, grading.id]);

  // Set initial selected file when files are loaded
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]);
    }
  }, [files, selectedFile]);

  // Simple save handlers like rubric page
  const handleSaveFeedback = async () => {
    if (updateFeedbackMutation.isPending) return;
    try {
      await updateFeedbackMutation.mutateAsync(formData.feedbacks);
      toast.success("Feedback updated successfully");
      updateLastSavedData({ feedbacks: formData.feedbacks });
    } catch (error) {
      console.error("Failed to update feedback:", error);
      toast.error("Failed to update feedback");
    }
  };

  const handleSaveScore = async () => {
    if (updateScoreMutation.isPending) return;
    try {
      await updateScoreMutation.mutateAsync(formData.scoreBreakdowns);
      toast.success("Score updated successfully");
      updateLastSavedData({ scoreBreakdowns: formData.scoreBreakdowns });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["assessment", currentAssessment.id] });
      queryClient.invalidateQueries({ queryKey: ["gradingAssessments", grading.id] });
    } catch (error) {
      console.error("Failed to update score:", error);
      toast.error("Failed to update score");
    }
  };

  // Score update handler with validation
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save feedback
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (!updateFeedbackMutation.isPending) {
          handleSaveFeedback();
        }
      }

      // Ctrl+Shift+S to save score
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "S") {
        event.preventDefault();
        if (!updateScoreMutation.isPending) {
          handleSaveScore();
        }
      }

      // Escape to close panels
      if (event.key === "Escape") {
        // Can be used to close dialogs or panels
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

  // Just use the current formData directly, React.memo will handle the optimization
  // The issue is not about preventing re-renders but ensuring they only happen when needed

  return (
    <div className="-mb-21 -mt-13 h-[92.5vh] max-h-[100vh] min-w-250 relative flex flex-col bg-background text-foreground overflow-hidden">
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
      <div className="flex-1 min-h-0 pt-2">
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
                  <p className="text-xs text-muted-foreground">{fileLoadError}</p>
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
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={30} maxSize={75}>
                <ScoringPanel
                  rubric={rubric}
                  grading={grading}
                  formData={formData}
                  updateScore={handleUpdateScore}
                  assessmentId={currentAssessment.id}
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
