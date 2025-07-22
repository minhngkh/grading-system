import { useEffect, useState, useCallback, useRef } from "react";
import { Assessment, AssessmentSchema, AssessmentState } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import { ScoringPanel } from "@/components/app/scoring-panel";
import MainWorkspace from "@/components/app/main-workspace";
import { AssessmentHeader } from "@/components/app/assessment-header";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import { getFileItemsQueryOptions } from "@/queries/file-queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileItem } from "@/types/file";
import { SignalRService } from "@/services/realtime-service";
import { AssessmentGradingStatus } from "@/types/grading-progress";
import { toast } from "sonner";
import { useAuth } from "@clerk/clerk-react";
import PendingComponent from "@/components/app/route-pending";

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

  const form = useForm<Assessment>({
    resolver: zodResolver(AssessmentSchema),
    defaultValues: assessment,
    mode: "onChange",
  });

  const formData = form.watch();
  const [lastSaved, setLastSaved] = useState<Assessment>(assessment);

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [activeScoringTab, setActiveScoringTab] = useState<string>(
    rubric.criteria[0]?.name || "",
  );

  const {
    data: fileItems,
    isFetching: isLoadingFiles,
    error: fileLoadError,
  } = useQuery(getFileItemsQueryOptions(grading.id, formData.submissionReference, auth));

  useEffect(() => {
    if (isLoadingFiles || fileLoadError) return;

    if (fileItems && fileItems.length > 0) {
      setSelectedFile(fileItems[0]);
    }
  }, [isLoadingFiles, fileItems, fileLoadError]);

  const handleStatusChange = useCallback((newStatus: AssessmentGradingStatus) => {
    if (newStatus.assessmentId !== assessment.id) return;

    form.setValue("status", newStatus.status);
    if (
      newStatus.status === AssessmentState.Completed ||
      newStatus.status === AssessmentState.AutoGradingFinished
    ) {
      queryClient.refetchQueries({
        queryKey: ["assessment", assessment.id],
      });
      queryClient.refetchQueries({
        queryKey: ["scoreAdjustments", assessment.id],
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const token = await auth.getToken();
      if (!token || !isMounted || hubRef.current) return;

      try {
        const hub = new SignalRService(() => token);
        hub.on("ReceiveAssessmentProgress", handleStatusChange);
        await hub.start();
        hubRef.current = hub;
        hub.invoke("Register", grading.id);
      } catch (error) {
        console.error("Error starting SignalR hub:", error);
        toast.error("Failed to regrade assessments. Please try again later.");
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
  }, []);

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
      setLastSaved((prev) => ({
        ...prev,
        ...updatedAssessmentData,
      }));
    },
    [lastSaved],
  );

  if (assessment.status === AssessmentState.AutoGradingStarted) {
    return (
      <div className="flex items-center justify-center h-full">
        <PendingComponent message="Assessment is being graded. Please wait..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Header */}
      <AssessmentHeader
        assessment={formData}
        lastSavedData={lastSaved}
        grading={grading}
        rubric={rubric}
        onUpdate={onUpdateAssessment}
        onUpdateLastSave={onUpdateLastSaveAssessment}
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
                files={fileItems || []}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                assessment={formData}
                grading={grading}
                rubric={rubric}
                activeScoringTab={activeScoringTab}
                onUpdate={onUpdateAssessment}
                onUpdateLastSave={onUpdateLastSaveAssessment}
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
                  assessment={formData}
                  activeScoringTab={activeScoringTab}
                  setActiveScoringTab={setActiveScoringTab}
                  onUpdate={onUpdateAssessment}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
