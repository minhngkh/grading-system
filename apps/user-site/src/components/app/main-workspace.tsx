import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Files, MessageSquare, Code } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

export const MainWorkspace: React.FC<MainWorkspaceProps> = React.memo(
  ({
    files,
    assessment,
    grading,
    rubric,
    activeScoringTab,
    form,
    selectedFile: externalSelectedFile,
    onFileSelect: externalOnFileSelect,
  }) => {
    const [internalSelectedFile, setInternalSelectedFile] = useState<any | null>(null);
    const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

    const selectedFile = externalSelectedFile ?? internalSelectedFile;
    const onFileSelect = externalOnFileSelect ?? setInternalSelectedFile;

    const handleFeedbackSelect = useCallback((feedbackId: string | null) => {
      setActiveFeedbackId(feedbackId);
    }, []);

    const generateUID = useCallback(() => {
      const first = (Math.random() * 46656) | 0;
      const second = (Math.random() * 46656) | 0;
      const part1 = ("000" + first.toString(36)).slice(-3);
      const part2 = ("000" + second.toString(36)).slice(-3);
      return (part1 + part2).toUpperCase();
    }, []);

    const addFeedback = useCallback(
      (feedback: FeedbackItem) => {
        try {
          const feedbackWithId = { ...feedback, id: feedback.id || generateUID() };
          const currentFeedbacks = form.getValues("feedbacks") || [];
          form.setValue("feedbacks", [...currentFeedbacks, feedbackWithId], {
            shouldValidate: false,
          });
        } catch (error) {
          console.error("Error adding feedback:", error);
        }
      },
      [form, generateUID],
    );

    const updateFeedback = useCallback(
      (feedbackId: string, feedback: FeedbackItem) => {
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
      },
      [form],
    );

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarView, setSidebarView] = useState<"files" | "testcases" | "feedback">(
      "files",
    );

    const [feedbackViewMode, setFeedbackViewMode] = useState<"file" | "criterion">(
      "file",
    );
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
      src: true,
      tests: true,
    });

    const [isHighlightMode, setIsHighlightMode] = useState(false);
    const [canAddFeedback, setCanAddFeedback] = useState(false);
    const [selectedPage, setSelectedPage] = useState<number | null>(null);
    const [selectionRange, setSelectionRange] = useState<any>(null);

    const fileFeedbacks = useMemo(() => {
      if (!selectedFile || !assessment?.feedbacks) return [];

      try {
        return assessment.feedbacks.filter((fb: FeedbackItem) => {
          if (!fb?.fileRef) return false;
          const fileName = selectedFile.relativePath || selectedFile.name;

          return (
            fb.fileRef.endsWith(fileName) ||
            fb.fileRef.includes(`/${fileName}`) ||
            fb.fileRef.split("/").pop() === fileName
          );
        });
      } catch (error) {
        console.error("Error filtering feedbacks:", error);
        return [];
      }
    }, [selectedFile, assessment?.feedbacks]);

    const rubricCriteria = useMemo(
      () => rubric?.criteria?.map((c) => c.name) || [],
      [rubric?.criteria],
    );

    const currentFileFeedbacks = useMemo(() => {
      if (!selectedFile || !assessment?.feedbacks) return [];

      try {
        return assessment.feedbacks.filter((f: FeedbackItem) => {
          if (!f?.fileRef) return false;
          const fileName = selectedFile.relativePath || selectedFile.name;

          return (
            f.fileRef.endsWith(fileName) ||
            f.fileRef.includes(`/${fileName}`) ||
            f.fileRef.split("/").pop() === fileName
          );
        });
      } catch (error) {
        console.error("Error filtering feedbacks for current file:", error);
        return [];
      }
    }, [selectedFile, assessment?.feedbacks]);

    const currentCriterionFeedbacks = useMemo(() => {
      if (!activeScoringTab || !assessment?.feedbacks) return [];

      try {
        return assessment.feedbacks.filter((f) => f.criterion === activeScoringTab);
      } catch (error) {
        console.error("Error filtering feedbacks for criterion:", error);
        return [];
      }
    }, [activeScoringTab, assessment?.feedbacks]);

    const handleFeedbackClick = useCallback(
      (feedback: FeedbackItem) => {
        if (!feedback?.id) {
          console.warn("Invalid feedback object:", feedback);
          return;
        }

        if (activeFeedbackId === feedback.id) {
          handleFeedbackSelect(null);
          return;
        }

        if (feedback.fileRef) {
          const feedbackFile = files.find((f) => {
            const fileName = f.relativePath || f.name;
            return (
              feedback.fileRef?.endsWith(fileName) ||
              feedback.fileRef?.includes(`/${fileName}`) ||
              feedback.fileRef?.split("/").pop() === fileName
            );
          });

          if (feedbackFile && feedbackFile !== selectedFile) {
            onFileSelect(feedbackFile);
          }
        }

        handleFeedbackSelect(feedback.id);
      },
      [activeFeedbackId, selectedFile, files, onFileSelect, handleFeedbackSelect],
    );

    const handleFileSelectInternal = useCallback(
      (file: any) => {
        if (file !== selectedFile) {
          onFileSelect(file);
          setCanAddFeedback(false);
          setSelectedPage(null);
          setIsHighlightMode(false);
        }
      },
      [onFileSelect, selectedFile],
    );

    const prevSelectedFileRef = useRef(selectedFile);

    useEffect(() => {
      if (prevSelectedFileRef.current !== selectedFile) {
        prevSelectedFileRef.current = selectedFile;

        if (activeFeedbackId && selectedFile) {
          const activeFeedback = assessment?.feedbacks?.find(
            (f) => f.id === activeFeedbackId,
          );
          if (activeFeedback && activeFeedback.fileRef) {
            const feedbackBelongsToCurrentFile =
              activeFeedback.fileRef.endsWith(
                selectedFile.relativePath || selectedFile.name,
              ) ||
              activeFeedback.fileRef.includes(
                `/${selectedFile.relativePath || selectedFile.name}`,
              ) ||
              activeFeedback.fileRef.split("/").pop() ===
                (selectedFile.relativePath || selectedFile.name);

            if (!feedbackBelongsToCurrentFile) {
              handleFeedbackSelect(null);
            }
          }
        }
      }
    });

    useEffect(() => {
      if (files.length > 0 && !selectedFile) {
        setInternalSelectedFile(files[0]);
      }
    }, [files, selectedFile]);

    const handleAddFeedback = useCallback(
      (newFeedback: Partial<FeedbackItem>) => {
        if (!selectedFile) {
          toast.error("No file selected for feedback");
          return;
        }

        if (!newFeedback.comment?.trim()) {
          toast.error("Feedback comment cannot be empty");
          return;
        }

        try {
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
            locationData = {
              type: "text" as const,
              fromLine: 1,
              toLine: 1,
              fromCol: 0,
              toCol: 0,
            };
          }

          const fileReference = `${assessment?.submissionReference || ""}/${selectedFile?.relativePath || selectedFile?.name || ""}`;

          const completeFeedback: FeedbackItem = {
            id: newFeedback.id || generateUID(),
            criterion: newFeedback.criterion || "",
            comment: newFeedback.comment.trim(),
            tag: newFeedback.tag || "info",
            fileRef: fileReference,
            locationData,
            ...newFeedback,
          };

          addFeedback(completeFeedback);

          setCanAddFeedback(false);
          setSelectedPage(null);
          setIsHighlightMode(false);
          setSelectionRange(null);
        } catch (error) {
          console.error("Error adding feedback:", error);
          toast.error("Failed to add feedback");
        }
      },
      [
        selectedFile,
        selectedPage,
        selectionRange,
        assessment?.submissionReference,
        generateUID,
        addFeedback,
      ],
    );

    const handleUpdateFeedback = useCallback(
      (feedbackId: string, updatedFeedback: FeedbackItem) => {
        updateFeedback(feedbackId, updatedFeedback);
      },
      [updateFeedback],
    );

    const handleAddFeedbackClick = useCallback(() => {
      if (isHighlightMode) {
        setIsHighlightMode(false);
        setCanAddFeedback(false);
        setSelectedPage(null);
      } else if (canAddFeedback || selectedPage) {
        setIsHighlightMode(true);

        setSidebarView("feedback");
        setFeedbackViewMode("file");
      }
    }, [isHighlightMode, canAddFeedback, selectedPage]);

    const handleCancelSelection = useCallback(() => {
      setCanAddFeedback(false);
      setSelectedPage(null);
      setIsHighlightMode(false);
      setSelectionRange(null);

      if (window.getSelection) {
        const selection = window.getSelection();
        if (selection) selection.removeAllRanges();
      }
    }, []);

    const handleSelectionMade = useCallback((locationData?: any) => {
      setCanAddFeedback(true);

      setSidebarView("feedback");
      setFeedbackViewMode("file");
    }, []);

    const handlePageSelect = useCallback((page: number | null) => {
      setSelectedPage(page);
      if (page !== null) {
        setCanAddFeedback(true);
      }
    }, []);

    const handleHighlightComplete = useCallback(() => {
      setIsHighlightMode(false);
      setCanAddFeedback(false);
      setSelectedPage(null);
      setSelectionRange(null);
    }, []);

    const handleSelectionChange = useCallback((range: any) => {
      setSelectionRange(range);
      if (range) {
        setCanAddFeedback(true);
      }
    }, []);

    const handleSidebarToggle = useCallback(
      (view: "files" | "testcases" | "feedback") => {
        if (sidebarView === view) {
          setIsSidebarOpen((prev) => !prev);
          return;
        }

        setIsSidebarOpen(true);
        setSidebarView(view);
      },
      [sidebarView, isSidebarOpen],
    );

    const fileExplorerProps = useMemo(
      () => ({
        files,
        selectedFile,
        setSelectedFile: handleFileSelectInternal,
        expandedFolders,
        setExpandedFolders,
        feedbacks: assessment.feedbacks,
        grading,
      }),
      [
        files,
        selectedFile,
        handleFileSelectInternal,
        expandedFolders,
        assessment.feedbacks,
        grading,
      ],
    );

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
        return {
          type: "text" as const,
          fromLine: 1,
          toLine: 1,
          fromCol: 0,
          toCol: 0,
        };
      }
    }, [selectedFile, selectedPage, selectionRange]);

    const renderSidebarContent = useMemo(() => {
      switch (sidebarView) {
        case "files":
          return (
            <div className="p-4">
              <FileExplorer {...fileExplorerProps} />
            </div>
          );
        case "testcases":
          return (
            <div className="p-4">
              <h3 className="text-sm font-medium mb-2">Test Cases</h3>
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
                <TabsContent
                  value="file"
                  className="flex flex-col flex-1 overflow-hidden"
                >
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
    }, [
      sidebarView,
      fileExplorerProps,
      feedbackViewMode,
      currentFileFeedbacks,
      currentCriterionFeedbacks,
      activeFeedbackId,
      handleFeedbackClick,
      handleAddFeedback,
      handleCancelSelection,
      assessment,
      rubricCriteria,
      selectedFile,
      locationData,
      form,
      isHighlightMode,
      activeScoringTab,
    ]);

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
          <div className="w-full overflow-hidden">
            <FileViewer
              file={selectedFile}
              feedbacks={fileFeedbacks}
              updateFeedback={handleUpdateFeedback}
              activeFeedbackId={activeFeedbackId}
              onSelectionMade={handleSelectionMade}
              onPageSelect={handlePageSelect}
              onSelectionChange={handleSelectionChange}
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
      handlePageSelect,
      handleSelectionChange,
      selectedPage,
    ]);

    return (
      <div className="h-full flex">
        <div className="h-full flex bg-background border-r">
          <div className="w-10 flex flex-col">
            <button
              onClick={() => handleSidebarToggle("files")}
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
              onClick={() => handleSidebarToggle("testcases")}
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
              onClick={() => handleSidebarToggle("feedback")}
              className={`flex items-center justify-center h-10 w-full transition-colors ${
                sidebarView === "feedback" ?
                  "bg-primary/5 text-primary border-r-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              title="Feedback"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            className={cn(isSidebarOpen ? "block" : "hidden")}
            defaultSize={20}
            minSize={20}
            maxSize={30}
          >
            {renderSidebarContent}
          </ResizablePanel>

          <ResizableHandle className={cn(isSidebarOpen ? "block" : "hidden")} />

          <ResizablePanel defaultSize={isSidebarOpen ? 80 : 100}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between border-b px-2 py-1">
                <h2 className="font-semibold truncate">{selectedFile?.name}</h2>
                <div className="flex items-center gap-2">
                  {(canAddFeedback || selectedPage) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelSelection}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleAddFeedbackClick}
                    className="text-xs"
                    disabled={isHighlightMode || (!canAddFeedback && !selectedPage)}
                  >
                    {isHighlightMode ? "Adding Highlight" : "Add Feedback"}
                  </Button>
                </div>
              </div>

              {/* File Viewer */}
              <div className="grid">{renderFileViewer}</div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  },
);

export default React.memo(MainWorkspace);
