import { useEffect, useState, useCallback } from "react";
import { Assessment } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import { toast } from "sonner";
import { ScoringPanel } from "@/components/app/scoring-panel";
import { FileService } from "@/services/file-service";
import MainWorkspace from "@/components/app/main-workspace";
import { AssessmentHeader } from "@/components/app/assessment-header";
import { useAssessmentState } from "@/hooks/use-assessment-state";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

export function EditAssessmentUI({
  assessment,
  grading,
  rubric,
}: {
  assessment: Assessment;
  grading: GradingAttempt;
  rubric: Rubric;
}) {
  const {
    form,
    formData,
    canRevert,
    // hasUnsavedChanges, // TEMPORARILY UNUSED due to auto-save disabled
    updateLastSavedData,
    markCurrentAsValidated,
    resetToInitial,
  } = useAssessmentState(assessment);

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

  // Setup mutations directly like rubric page
  const queryClient = useQueryClient();
  const auth = useAuth();
  const updateFeedbackMutation = useMutation(
    updateFeedbackMutationOptions(assessment.id, auth, {
      onSuccess: (_, feedbacks) => {
        toast.success("Feedback updated successfully");
        updateLastSavedData({ feedbacks });

        // TEMPORARILY DISABLED: Query invalidation may cause feedback duplication
        // TODO: Re-enable with proper race condition handling
        // queryClient.invalidateQueries({ queryKey: ["assessment", assessment.id] });
        // queryClient.invalidateQueries({ queryKey: ["gradingAssessments", grading.id] });
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

        // Invalidate related queries
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
  }, [formData.submissionReference, grading.id]); // Remove selectedFile dependency

  // Set initial selected file when files are loaded
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]);
    }
  }, [files, selectedFile]);

  // Mark current state as validated after files are loaded and initial validation is complete
  useEffect(() => {
    if (files.length > 0 && !isLoadingFiles && !fileLoadError) {
      // Longer delay to ensure all validation and internal updates are complete
      const timer = setTimeout(() => {
        markCurrentAsValidated();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [files.length, isLoadingFiles, fileLoadError, markCurrentAsValidated]);

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
  // Save handlers
  const handleSaveFeedback = async () => {
    if (updateFeedbackMutation.isPending) return;

    try {
      await updateFeedbackMutation.mutateAsync(formData.feedbacks);
    } catch (error) {
      // Error handling is done in the mutation onError callback
    }
  };

  const handleSaveScore = async () => {
    if (updateScoreMutation.isPending) return;

    try {
      await updateScoreMutation.mutateAsync(formData.scoreBreakdowns);
    } catch (error) {
      // Error handling is done in the mutation onError callback
    }
  };

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

  // Auto-save functionality (disabled to prevent duplicate feedback issue)
  // NOTE: Auto-save was causing feedback duplication due to dependency loop
  // Re-enable with careful dependency management if needed
  /* 
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(async () => {
      // Only auto-save if there are changes and no manual save is in progress
      const isLoading =
        updateFeedbackMutation.isPending ||
        updateScoreMutation.isPending;
      
      if (hasUnsavedChanges && !isLoading) {
        try {
          await updateFeedbackMutation.mutateAsync(formData.feedbacks);
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }
    }, 30000); // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [
    hasUnsavedChanges,
    updateFeedbackMutation.isPending,
    updateScoreMutation.isPending,
    rerunAssessmentMutation.isPending,
    // Remove handleSaveFeedback from dependencies to prevent loop
  ]);
  */

  // Create current assessment data with form data
  const currentAssessment: Assessment = {
    ...assessment,
    feedbacks: formData.feedbacks || [],
    scoreBreakdowns: formData.scoreBreakdowns || [],
    rawScore: formData.rawScore || 0,
  };

  // Just use the current formData directly, React.memo will handle the optimization
  // The issue is not about preventing re-renders but ensuring they only happen when needed

  return (
    <div className="-mb-21 -mt-13 h-[92.5vh] max-h-[100vh] min-w-250 relative flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <AssessmentHeader
        form={form}
        assessment={currentAssessment}
        grading={grading}
        rubric={rubric}
        canRevert={canRevert}
        handleRevert={() => {
          resetToInitial();
          toast.success("Reverted to saved data.");
        }}
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
                assessment={currentAssessment}
                grading={grading}
                rubric={rubric}
                activeScoringTab={activeScoringTab}
                form={form}
              />
            }
          </ResizablePanel>

          {!showBottomPanel && (
            <ChevronsUp
              className="absolute bottom-3 left-1/2 transform -translate-x-1/2 h-6 w-6 text-muted-foreground cursor-pointer z-50"
              onClick={() => setShowBottomPanel(true)}
            />
          )}
          {showBottomPanel && (
            <div className="relative">
              <ChevronsDown
                className="absolute bottom-2 left-1/2 transform -translate-x-1/2 h-6 w-6 text-muted-foreground cursor-pointer z-50 "
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
