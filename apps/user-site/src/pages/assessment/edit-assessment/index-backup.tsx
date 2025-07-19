import { useEffect, useState, useCallback, useRef } from "react";
import { Assessment, AssessmentSchema, AssessmentState } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import { ScoringPanel } from "@/components/app/scoring-panel";
import MainWorkspace from "@/components/app/main-workspace";
import { AssessmentHeader } from "@/components/app/assessment-header";
import useAssessmentForm from "@/hooks/use-assessment-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import { getFileItemsQueryOptions } from "@/queries/file-queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rerunAssessmentMutationOptions } from "@/queries/assessment-queries";
import { toast } from "sonner";
import { MainSkeleton, ScoreSkeleton } from "@/pages/assessment/edit-assessment/skeleton";
import { SignalRService } from "@/services/realtime-service";
import { AssessmentGradingStatus } from "@/types/grading-progress";  const handleStatusChangeRef = useRef<(newStatus: AssessmentGradingStatus) => void>();

  const handleStatusChange = useCallback(
    (newStatus: AssessmentGradingStatus) => {
      if (newStatus.assessmentId === assessment.id) {
        setAssessmentStatus(newStatus);

        // Update form data with new status
        form.setValue("status", newStatus.status);
      }
    },
    [assessment.id, form],
  );

  // Update ref when callback changes
  useEffect(() => {
    handleStatusChangeRef.current = handleStatusChange;
  }, [handleStatusChange]);chema, AssessmentState } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import { ScoringPanel } from "@/components/app/scoring-panel";
import MainWorkspace from "@/components/app/main-workspace";
import { AssessmentHeader } from "@/components/app/assessment-header";
import useAssessmentForm from "@/hooks/use-assessment-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import { getFileItemsQueryOptions } from "@/queries/file-queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rerunAssessmentMutationOptions } from "@/queries/assessment-queries";
import { toast } from "sonner";
import { MainSkeleton, ScoreSkeleton } from "@/pages/assessment/edit-assessment/skeleton";
import { SignalRService } from "@/services/realtime-service";
import { AssessmentGradingStatus } from "@/types/grading-progress";

const getCardClassName = (state: AssessmentState) => {
  if (state === AssessmentState.AutoGradingFailed) {
    return "overflow-hidden py-0 border-red-200 dark:border-red-800";
  }

  if (state === AssessmentState.AutoGradingFinished) {
    return "overflow-hidden py-0 border-green-200 dark:border-green-800";
  }

  if (state === AssessmentState.AutoGradingStarted || state === AssessmentState.Created) {
    return "overflow-hidden py-0 border-blue-200 dark:border-blue-800";
  }

  if (state === AssessmentState.ManualGradingRequired) {
    return "overflow-hidden py-0 border-orange-200 dark:border-orange-800";
  }

  return "overflow-hidden py-0";
};

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
  const hubRef = useRef<SignalRService | undefined>(undefined);
  const handleStatusChangeRef = useRef<(newStatus: AssessmentGradingStatus) => void>();

  const form = useForm<Assessment>({
    resolver: zodResolver(AssessmentSchema),
    defaultValues: assessment,
    mode: "onChange",
  });
  const formData = form.watch();

  const lastSaved = useForm<Assessment>({
    resolver: zodResolver(AssessmentSchema),
    defaultValues: assessment,
    mode: "onChange",
  });

  const lastSavedData = lastSaved.watch();

  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [activeScoringTab, setActiveScoringTab] = useState<string>(
    rubric.criteria[0]?.name || "",
  );
  const [assessmentStatus, setAssessmentStatus] =
    useState<AssessmentGradingStatus | null>(null);
  const [isRegrading, setIsRegrading] = useState(false);

  const handleFileSelect = useCallback((file: any) => {
    setSelectedFile(file);
  }, []);

  const handleStatusChange = useCallback(
    (newStatus: AssessmentGradingStatus) => {
      if (newStatus.assessmentId === assessment.id) {
        setAssessmentStatus(newStatus);

        // Update form data with new status
        form.setValue("status", newStatus.status);
      }
    },
    [assessment.id, form],
  );

  // SignalR connection setup
  useEffect(() => {
    let isMounted = true;

    (async () => {
      const token = await auth.getToken();
      if (!token || !isMounted) return;

      try {
        const hub = new SignalRService(() => token);

        hub.on("ReceiveAssessmentProgress", (newStatus: AssessmentGradingStatus) => {
          handleStatusChangeRef.current?.(newStatus);
        });
        hub.on("Complete", () => {
          queryClient.invalidateQueries({
            queryKey: ["assessment", assessment.id],
          });
          queryClient.invalidateQueries({
            queryKey: ["scoreAdjustments", assessment.id],
          });
          setIsRegrading(false);
          toast.success("Assessment regrade completed successfully");
        });

        await hub.start();
        if (!isMounted) return;

        hubRef.current = hub;
        const initialState = await hub.invoke("Register", grading.id);

        // Find current assessment in initial state
        const currentAssessmentStatus = initialState.find(
          (a: AssessmentGradingStatus) => a.assessmentId === assessment.id,
        );
        if (currentAssessmentStatus) {
          setAssessmentStatus(currentAssessmentStatus);
        }
      } catch (error) {
        console.error("Error starting SignalR hub:", error);
        toast.error("Failed to connect to realtime updates.");
      }
    })();

    return () => {
      isMounted = false;
      if (hubRef.current) {
        hubRef.current.off("ReceiveAssessmentProgress");
        hubRef.current.off("Complete");
        hubRef.current.stop();
        hubRef.current = undefined;
      }
    };
  }, [assessment.id, grading.id, auth, queryClient]); // Stable dependencies only

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

  const onUpdateAssessment = useCallback(
    (updatedAssessmentData: Partial<Assessment>) => {
      Object.entries(updatedAssessmentData).forEach(([key, value]) => {
        form.setValue(key as keyof Assessment, value);
      });
    },
    [form],
  );

  const onUpdateLastSaveAssessment = useCallback(
    (updatedAssessmentData: Partial<Assessment>) => {
      Object.entries(updatedAssessmentData).forEach(([key, value]) => {
        lastSaved.setValue(key as keyof Assessment, value);
      });
    },
    [lastSaved],
  );

  const { mutate: rerunAssessment } = useMutation(
    rerunAssessmentMutationOptions(auth, {
      onSuccess: () => {
        setIsRegrading(true);
        queryClient.invalidateQueries({
          queryKey: ["assessment", formData.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["scoreAdjustments", formData.id],
        });
        toast.success("Assessment regrade started successfully");
      },
      onError: (error) => {
        console.error("Failed to rerun assessment:", error);
        toast.error(
          `Failed to rerun assessment: ${assessment.submissionReference}. Please try again.`,
        );
        setIsRegrading(false);
      },
    }),
  );
  console.log("abc");

  // Get current status (use realtime status if available, otherwise form data status)
  const currentStatus = assessmentStatus?.status || formData.status;
  const isGradingInProgress =
    currentStatus === AssessmentState.AutoGradingStarted || isRegrading;

  return (
    <div
      className={`h-full relative flex flex-col bg-background text-foreground overflow-hidden space-y-4 ${getCardClassName(currentStatus)}`}
    >
      <AssessmentHeader
        assessment={formData}
        lastSavedData={lastSavedData}
        grading={grading}
        rubric={rubric}
        rerunAssessment={rerunAssessment}
        onUpdate={onUpdateAssessment}
        onUpdateLastSave={onUpdateLastSaveAssessment}
      />

      <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={showBottomPanel ? 80 : 100} minSize={25}>
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
            : isGradingInProgress ?
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MainSkeleton />
                  <p className="text-sm text-muted-foreground mt-4">
                    {isRegrading ?
                      "Regrading in progress..."
                    : "Assessment is being processed..."}
                  </p>
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
                onUpdate={onUpdateAssessment}
                onUpdateLastSave={onUpdateLastSaveAssessment}
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
              <ResizablePanel defaultSize={40} minSize={20} maxSize={75}>
                {isGradingInProgress ?
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <ScoreSkeleton />
                      <p className="text-sm text-muted-foreground mt-4">
                        {isRegrading ?
                          "Regrading in progress..."
                        : "Scoring is being processed..."}
                      </p>
                    </div>
                  </div>
                : <ScoringPanel
                    rubric={rubric}
                    grading={grading}
                    assessment={formData}
                    activeScoringTab={activeScoringTab}
                    setActiveScoringTab={setActiveScoringTab}
                    onUpdate={onUpdateAssessment}
                  />
                }
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
