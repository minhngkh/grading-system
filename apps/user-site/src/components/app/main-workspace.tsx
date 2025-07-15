import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Files, MessageSquare, Code, PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileExplorer } from "@/components/app/file-explorer";
import { FeedbackListPanel } from "@/components/app/feedback-list-panel";
import FileViewer from "@/pages/assessment/edit-assessment/viewer/file-viewer";
import { Assessment, FeedbackItem } from "@/types/assessment";
import { GradingAttempt } from "@/types/grading";
import { Rubric } from "@/types/rubric";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface MainWorkspaceProps {
  files: any[];
  assessment: Assessment;
  grading: GradingAttempt;
  rubric: Rubric;
  activeScoringTab: string;
  form: UseFormReturn<Assessment>;
  selectedFile?: any;
  onFileSelect?: (file: any) => void;
}

export const MainWorkspace: React.FC<MainWorkspaceProps> = React.memo(({
  files,
  assessment,
  grading,
  rubric,
  activeScoringTab,
  form,
  selectedFile: externalSelectedFile,
  onFileSelect: externalOnFileSelect,
}) => {
  // Internal state management
  const [internalSelectedFile, setInternalSelectedFile] = useState<any | null>(null);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  
  // Use external selectedFile if provided, otherwise use internal state
  const selectedFile = externalSelectedFile ?? internalSelectedFile;
  const onFileSelect = externalOnFileSelect ?? setInternalSelectedFile;
  
  // Internal feedback selection handler
  const handleFeedbackSelect = useCallback((feedbackId: string | null) => {
    setActiveFeedbackId(feedbackId);
  }, []);
  // Helper function to generate unique IDs
  const generateUID = useCallback(() => {
    const first = (Math.random() * 46656) | 0;
    const second = (Math.random() * 46656) | 0;
    const part1 = ("000" + first.toString(36)).slice(-3);
    const part2 = ("000" + second.toString(36)).slice(-3);
    return (part1 + part2).toUpperCase();
  }, []);

  // Helper functions for feedback operations (no toast - direct form updates)
  const addFeedback = useCallback((feedback: FeedbackItem) => {
    try {
      const feedbackWithId = { ...feedback, id: feedback.id || generateUID() };
      const currentFeedbacks = form.getValues("feedbacks") || [];
      form.setValue("feedbacks", [...currentFeedbacks, feedbackWithId], {
        shouldValidate: false,
      });
    } catch (error) {
      console.error("Error adding feedback:", error);
    }
  }, [form, generateUID]);

  const updateFeedback = useCallback((feedbackId: string, feedback: FeedbackItem) => {
    try {
      const currentFeedbacks = form.getValues("feedbacks") || [];
      const index = currentFeedbacks.findIndex((f) => f.id === feedbackId);
      
      if (index !== -1) {
        const updated = [...currentFeedbacks];
        updated[index] = { ...updated[index], ...feedback };
        form.setValue("feedbacks", updated, { shouldValidate: false });
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
    }
  }, [form]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarView, setSidebarView] = useState<"files" | "testcases" | "feedback">(
    "files",
  );
  const [feedbackViewMode, setFeedbackViewMode] = useState<"file" | "criterion">("file");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    tests: true,
  });
  // Use activeFeedbackId as the single source of truth for selected feedback
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [canAddFeedback, setCanAddFeedback] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [selectionRange, setSelectionRange] = useState<any>(null);

  // Memoize file feedbacks for performance
  const fileFeedbacks = useMemo(() => {
    if (!selectedFile || !assessment?.feedbacks) return [];

    try {
      return assessment.feedbacks.filter((fb: FeedbackItem) => {
        if (!fb?.fileRef) return false;
        const fileName = selectedFile.relativePath || selectedFile.name;
        
        return (
          fb.fileRef.endsWith(fileName) ||
          fb.fileRef.includes(`/${fileName}`) ||
          fb.fileRef.split('/').pop() === fileName
        );
      });
    } catch (error) {
      console.error("Error filtering feedbacks:", error);
      return [];
    }
  }, [selectedFile, assessment?.feedbacks]);

  // Memoize rubric criteria
  const rubricCriteria = useMemo(() => 
    rubric?.criteria?.map((c) => c.name) || [], [rubric?.criteria]);

  // Memoize filtered feedbacks for current file
  const currentFileFeedbacks = useMemo(() => {
    if (!selectedFile || !assessment?.feedbacks) return [];

    try {
      return assessment.feedbacks.filter((f: FeedbackItem) => {
        if (!f?.fileRef) return false;
        const fileName = selectedFile.relativePath || selectedFile.name;
        
        return (
          f.fileRef.endsWith(fileName) ||
          f.fileRef.includes(`/${fileName}`) ||
          f.fileRef.split('/').pop() === fileName
        );
      });
    } catch (error) {
      console.error("Error filtering feedbacks for current file:", error);
      return [];
    }
  }, [selectedFile, assessment?.feedbacks]);

  // Memoize filtered feedbacks for current criterion
  const currentCriterionFeedbacks = useMemo(() => {
    if (!activeScoringTab || !assessment?.feedbacks) return [];

    try {
      return assessment.feedbacks.filter((f) => f.criterion === activeScoringTab);
    } catch (error) {
      console.error("Error filtering feedbacks for criterion:", error);
      return [];
    }
  }, [activeScoringTab, assessment?.feedbacks]);

  const handleFeedbackClick = useCallback((feedback: FeedbackItem) => {
    if (!feedback?.id) {
      console.warn("Invalid feedback object:", feedback);
      return;
    }

    // Toggle selection if same feedback
    if (activeFeedbackId === feedback.id) {
      handleFeedbackSelect(null);
      return;
    }

    // Find and select the feedback's file
    if (feedback.fileRef) {
      const feedbackFile = files.find((f) => {
        const fileName = f.relativePath || f.name;
        return (
          feedback.fileRef?.endsWith(fileName) ||
          feedback.fileRef?.includes(`/${fileName}`) ||
          feedback.fileRef?.split('/').pop() === fileName
        );
      });
      
      if (feedbackFile && feedbackFile !== selectedFile) {
        onFileSelect(feedbackFile);
      }
    }

    handleFeedbackSelect(feedback.id);
  }, [activeFeedbackId, selectedFile, files, onFileSelect, handleFeedbackSelect]);

  const handleFileSelectInternal = useCallback((file: any) => {
    // Only call onFileSelect if file actually changed
    if (file !== selectedFile) {
      onFileSelect(file);
      setCanAddFeedback(false);
      setSelectedPage(null);
      setIsHighlightMode(false);
      // Don't reset activeFeedbackId here - let it persist when changing files
      // setActiveFeedbackId(null);
    }
  }, [onFileSelect, selectedFile]);

  // Clear activeFeedbackId if it doesn't belong to current file
  // Only run when selectedFile changes, using a ref to track the previous file
  const prevSelectedFileRef = useRef(selectedFile);
  
  useEffect(() => {
    // Only check if the file actually changed
    if (prevSelectedFileRef.current !== selectedFile) {
      prevSelectedFileRef.current = selectedFile;
      
      if (activeFeedbackId && selectedFile) {
        const activeFeedback = assessment?.feedbacks?.find(f => f.id === activeFeedbackId);
        if (activeFeedback && activeFeedback.fileRef) {
          // Check if feedback belongs to current file
          const feedbackBelongsToCurrentFile = 
            activeFeedback.fileRef.endsWith(selectedFile.relativePath || selectedFile.name) ||
            activeFeedback.fileRef.includes(`/${selectedFile.relativePath || selectedFile.name}`) ||
            activeFeedback.fileRef.split('/').pop() === (selectedFile.relativePath || selectedFile.name);
          
          if (!feedbackBelongsToCurrentFile) {
            handleFeedbackSelect(null);
          }
        }
      }
    }
  }); // No dependencies - run on every render but with internal check

  // Set initial selected file when files are loaded
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setInternalSelectedFile(files[0]);
    }
  }, [files, selectedFile]);

  // Internal feedback operations using context
  const handleAddFeedback = useCallback((newFeedback: Partial<FeedbackItem>) => {
    if (!selectedFile) {
      toast.error("No file selected for feedback");
      return;
    }

    if (!newFeedback.comment?.trim()) {
      toast.error("Feedback comment cannot be empty");
      return;
    }

    try {
      // Create location data based on file type
      let locationData;
      if (selectedFile?.type === "pdf" && selectedPage) {
        locationData = { type: "pdf" as const, page: selectedPage };
      } else if (
        selectionRange &&
        (selectedFile?.type === "code" ||
          selectedFile?.type === "document" ||
          selectedFile?.type === "essay")
      ) {
        locationData = {
          type: "text" as const,
          fromLine: selectionRange.from?.line || 1,
          toLine: selectionRange.to?.line || 1,
          fromCol: selectionRange.from?.col || 0,
          toCol: selectionRange.to?.col || 0,
        };
      } else if (selectedFile?.type === "image") {
        locationData = { type: "image" as const };
      } else {
        // Default fallback for text-based files
        locationData = {
          type: "text" as const,
          fromLine: 1,
          toLine: 1,
          fromCol: 0,
          toCol: 0,
        };
      }

      const fileReference = `${assessment?.submissionReference || ""}/${selectedFile?.relativePath || selectedFile?.name || ""}`;

      // Complete the feedback with file reference and location data
      const completeFeedback: FeedbackItem = {
        id: newFeedback.id || generateUID(),
        criterion: newFeedback.criterion || "",
        comment: newFeedback.comment.trim(),
        tag: newFeedback.tag || "info",
        fileRef: fileReference,
        locationData,
        ...newFeedback,
      };

      // Add feedback directly without toast
      addFeedback(completeFeedback);

      setCanAddFeedback(false);
      setSelectedPage(null);
      setIsHighlightMode(false);
      setSelectionRange(null);
    } catch (error) {
      console.error("Error adding feedback:", error);
      toast.error("Failed to add feedback");
    }
  }, [selectedFile, selectedPage, selectionRange, assessment?.submissionReference, generateUID, addFeedback]);

  // Update feedback directly without toast
  const handleUpdateFeedback = useCallback((feedbackId: string, updatedFeedback: FeedbackItem) => {
    updateFeedback(feedbackId, updatedFeedback);
  }, [updateFeedback]);

  const handleAddFeedbackClick = useCallback(() => {
    if (isHighlightMode) {
      setIsHighlightMode(false);
      setCanAddFeedback(false);
      setSelectedPage(null);
    } else if (canAddFeedback || selectedPage) {
      setIsHighlightMode(true);
      // Switch to feedback tab and "by file" mode
      setSidebarView("feedback");
      setFeedbackViewMode("file");
    }
  }, [isHighlightMode, canAddFeedback, selectedPage]);

  const handleCancelSelection = useCallback(() => {
    setCanAddFeedback(false);
    setSelectedPage(null);
    setIsHighlightMode(false);
    setSelectionRange(null);
  }, []);

  // Consolidated page selection handler
  const handlePageSelect = useCallback((page: number | null) => {
    setSelectedPage(page);
    if (page !== null) {
      setCanAddFeedback(true);
    }
  }, []);

  // Handle highlight completion
  const handleHighlightComplete = useCallback(() => {
    setIsHighlightMode(false);
    setCanAddFeedback(false);
    setSelectedPage(null);
    setSelectionRange(null);
  }, []);

  // Handle selection change
  const handleSelectionChange = useCallback((range: any) => {
    setSelectionRange(range);
    if (range) {
      setCanAddFeedback(true);
    }
  }, []);

  // Handle sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Memoize FileExplorer props separately for stability
  const fileExplorerProps = useMemo(() => ({
    files,
    selectedFile,
    setSelectedFile: handleFileSelectInternal,
    expandedFolders,
    setExpandedFolders,
    feedbacks: assessment.feedbacks,
    grading,
  }), [files, selectedFile, handleFileSelectInternal, expandedFolders, assessment.feedbacks, grading]);

  // Create locationData from current state
  const locationData = useMemo(() => {
    if (selectedFile?.type === "pdf" && selectedPage) {
      return { type: "pdf" as const, page: selectedPage };
    } else if (
      selectionRange &&
      (selectedFile?.type === "code" ||
        selectedFile?.type === "document" ||
        selectedFile?.type === "essay")
    ) {
      return {
        type: "text" as const,
        fromLine: selectionRange.from?.line || 1,
        toLine: selectionRange.to?.line || 1,
        fromCol: selectionRange.from?.col || 0,
        toCol: selectionRange.to?.col || 0,
      };
    } else if (selectedFile?.type === "image") {
      return { type: "image" as const };
    } else {
      // Default fallback for text-based files
      return {
        type: "text" as const,
        fromLine: 1,
        toLine: 1,
        fromCol: 0,
        toCol: 0,
      };
    }
  }, [selectedFile, selectedPage, selectionRange]);

  // Render sidebar content with optimized memoization
  const renderSidebarContent = useMemo(() => {
    switch (sidebarView) {
      case "files":
        return <FileExplorer {...fileExplorerProps} />;
      case "testcases":
        return (
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Test Cases</h3>
            <div className="text-xs text-muted-foreground">
              Test cases will be displayed here
            </div>
          </div>
        );
      case "feedback":
        return (
          <div className="p-2 w-full h-full flex flex-col">
            <Tabs
              value={feedbackViewMode}
              onValueChange={(v) => setFeedbackViewMode(v as "file" | "criterion")}
              className="flex flex-col h-full"
            >
              <TabsList className="text-xs font-medium rounded-md w-full shrink-0">
                <TabsTrigger value="file" className="text-xs">
                  By File
                </TabsTrigger>
                <TabsTrigger value="criterion" className="text-xs">
                  By Criterion
                </TabsTrigger>
              </TabsList>
              <TabsContent value="file" className="flex flex-col flex-1 overflow-hidden">
                <h3 className="text-xs font-medium mb-3 shrink-0">
                  Feedback for {selectedFile?.name || "No file"}
                </h3>
                <FeedbackListPanel
                  feedbacks={currentFileFeedbacks}
                  selectedFeedbackId={activeFeedbackId}
                  onSelect={handleFeedbackClick}
                  assessment={assessment}
                  isAddingFeedback={isHighlightMode}
                  onAddFeedback={handleAddFeedback}
                  onCancelAdd={handleCancelSelection}
                  rubricCriteria={rubricCriteria}
                  currentFile={selectedFile}
                  locationData={locationData}
                  form={form}
                />
              </TabsContent>
              <TabsContent
                value="criterion"
                className="flex flex-col flex-1 overflow-hidden"
              >
                <h3 className="text-xs font-medium mb-3">
                  Feedback for {activeScoringTab || "No criterion"}
                </h3>
                <FeedbackListPanel
                  feedbacks={currentCriterionFeedbacks}
                  selectedFeedbackId={activeFeedbackId}
                  onSelect={handleFeedbackClick}
                  assessment={assessment}
                  isAddingFeedback={isHighlightMode && feedbackViewMode === "criterion"}
                  onAddFeedback={handleAddFeedback}
                  onCancelAdd={handleCancelSelection}
                  rubricCriteria={rubricCriteria}
                  currentFile={selectedFile}
                  locationData={locationData}
                  form={form}
                />
              </TabsContent>
            </Tabs>
          </div>
        );
      default:
        return null;
    }
  }, [sidebarView, fileExplorerProps, feedbackViewMode, currentFileFeedbacks, currentCriterionFeedbacks, activeFeedbackId, handleFeedbackClick, handleAddFeedback, handleCancelSelection, assessment, rubricCriteria, selectedFile, locationData, form, isHighlightMode, activeScoringTab]);

  // Render file viewer content
  const renderFileViewer = useMemo(() => {
    if (!selectedFile) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">No file selected</p>
            <p className="text-sm">Choose a file from the sidebar to start reviewing</p>
          </div>
        </div>
      );
    }

    try {
      return (
        <div className="flex-1 overflow-hidden">
          <FileViewer
            file={selectedFile}
            feedbacks={fileFeedbacks}
            addFeedback={handleAddFeedback}
            updateFeedback={handleUpdateFeedback}
            isHighlightMode={isHighlightMode}
            onHighlightComplete={handleHighlightComplete}
            activeFeedbackId={activeFeedbackId}
            rubricCriteria={rubricCriteria}
            gradingId={grading?.id || ""}
            submissionReference={assessment?.submissionReference || ""}
            onSelectionMade={() => setCanAddFeedback(true)}
            onPageSelect={handlePageSelect}
            onSelectionChange={handleSelectionChange}
            locationData={locationData}
            form={form}
          />
        </div>
      );
    } catch (error) {
      console.error("Error rendering FileViewer:", error);
      return (
        <div className="flex-1 flex items-center justify-center text-red-500">
          <div className="text-center">
            <p className="text-lg font-medium">Error loading file</p>
            <p className="text-sm">Please try selecting another file</p>
          </div>
        </div>
      );
    }
  }, [
    selectedFile,
    fileFeedbacks,
    handleAddFeedback,
    handleUpdateFeedback,
    isHighlightMode,
    handleHighlightComplete,
    activeFeedbackId,
    rubricCriteria,
    grading?.id,
    assessment?.submissionReference,
    handlePageSelect,
    handleSelectionChange,
    selectedPage,
    form,
  ]);

  return (
    <div className="h-full flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Sidebar */}
        {isSidebarOpen && (
          <>
            <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
              <div className="h-full flex bg-background border-r">
                {/* Sidebar Icons */}
                <div className="w-10 border-r flex flex-col">
                  <button
                    onClick={() => setSidebarView("files")}
                    className={`flex items-center justify-center h-10 w-full transition-colors ${
                      sidebarView === "files" ?
                        "bg-primary/5 text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    title="Files"
                  >
                    <Files className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSidebarView("testcases")}
                    className={`flex items-center justify-center h-10 w-full transition-colors ${
                      sidebarView === "testcases" ?
                        "bg-primary/5 text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    title="Test Cases"
                  >
                    <Code className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSidebarView("feedback")}
                    className={`flex items-center justify-center h-10 w-full transition-colors ${
                      sidebarView === "feedback" ?
                        "bg-primary/5 text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    title="Feedback"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>

                  <div className="flex-1" />
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 flex flex-col h-full min-w-0">
                  {renderSidebarContent}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Main Content Area */}
        <ResizablePanel defaultSize={isSidebarOpen ? 75 : 100}>
          <div className="h-full flex flex-col">
            {/* Header with file info and controls */}
            <div className="flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSidebarToggle}
                >
                  {!isSidebarOpen ?
                    <PanelLeftOpen className="h-4 w-4" />
                  : <PanelRightOpen className="h-4 w-4" />}
                </Button>
                <h2 className="text-sm font-medium truncate">
                  {selectedFile?.name || "No file selected"}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {(canAddFeedback || selectedPage) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelSelection}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddFeedbackClick}
                      className="text-xs"
                      disabled={isHighlightMode}
                    >
                      {isHighlightMode ? "Adding Highlight" : "Add Feedback"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* File Viewer */}
            {renderFileViewer}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
});

MainWorkspace.displayName = 'MainWorkspace';

export default React.memo(MainWorkspace);
