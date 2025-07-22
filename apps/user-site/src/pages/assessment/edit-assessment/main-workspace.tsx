import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Files, Code } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileExplorer } from "@/components/app/file-explorer";
import { FeedbackListPanel } from "@/components/app/feedback-list-panel";
import FileViewer from "@/pages/assessment/edit-assessment/viewer/file-viewer";
import { Assessment, FeedbackItem } from "@/types/assessment";
import { GradingAttempt } from "@/types/grading";
import { Rubric } from "@/types/rubric";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { FileItem } from "@/types/file";

interface MainWorkspaceProps {
  files: FileItem[];
  assessment: Assessment;
  grading: GradingAttempt;
  rubric: Rubric;
  activeScoringTab: string;
  selectedFile: FileItem | null;
  onFileSelect: (file: FileItem) => void;
  onUpdate: (updatedAssessment: Partial<Assessment>) => void;
  onUpdateLastSave: (updatedLastSaved: Partial<Assessment>) => void;
}

export const MainWorkspace: React.FC<MainWorkspaceProps> = React.memo(
  ({
    files,
    assessment,
    grading,
    rubric,
    activeScoringTab,
    selectedFile,
    onFileSelect,
    onUpdate,
    onUpdateLastSave,
  }) => {
    const [activeFeedbackId, setActiveFeedbackId] = useState<number | null>(null);

    const handleFeedbackSelect = useCallback((index: number | null) => {
      setActiveFeedbackId(index);
    }, []);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarView, setSidebarView] = useState<"files" | "testcases">("files");

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

    const rubricCriteria = useMemo(
      () => rubric?.criteria?.map((c) => c.name) || [],
      [rubric?.criteria],
    );

    const handleFeedbackClick = useCallback(
      (feedback: FeedbackItem, index: number) => {
        if (activeFeedbackId === index) {
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

        handleFeedbackSelect(index);
      },
      [activeFeedbackId, selectedFile, files, onFileSelect, handleFeedbackSelect],
    );

    const handleFileSelect = useCallback(
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

        if (
          typeof activeFeedbackId === "number" &&
          activeFeedbackId >= 0 &&
          selectedFile
        ) {
          const activeFeedback = assessment?.feedbacks?.[activeFeedbackId];
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
        onFileSelect(files[0]);
      }
    }, [files, selectedFile, onFileSelect]);

    const handleAddFeedbackClick = useCallback(() => {
      if (isHighlightMode) {
        setIsHighlightMode(false);
        setCanAddFeedback(false);
        setSelectedPage(null);
      } else if (canAddFeedback || selectedPage) {
        setIsHighlightMode(true);
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
      setFeedbackViewMode("file");
    }, []);

    const handlePageSelect = useCallback((page: number | null) => {
      setSelectedPage(page);
      if (page !== null) {
        setCanAddFeedback(true);
      }
    }, []);

    const handleSelectionChange = useCallback((range: any) => {
      setSelectionRange(range);
      if (range) {
        setCanAddFeedback(true);
      }
    }, []);

    const handleSidebarToggle = useCallback(
      (view: "files" | "testcases") => {
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
        setSelectedFile: handleFileSelect,
        expandedFolders,
        setExpandedFolders,
        feedbacks: assessment.feedbacks,
        grading,
      }),
      [
        files,
        selectedFile,
        handleFileSelect,
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
            <div className="px-4 pt-4 h-full flex flex-col">
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
        default:
          return null;
      }
    }, [
      sidebarView,
      fileExplorerProps,
      feedbackViewMode,
      activeFeedbackId,
      handleFeedbackClick,
      handleCancelSelection,
      assessment,
      rubricCriteria,
      selectedFile,
      locationData,
      isHighlightMode,
      activeScoringTab,
      onUpdate,
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
          <FileViewer
            file={selectedFile}
            activeFeedbackId={activeFeedbackId}
            onSelectionMade={handleSelectionMade}
            onPageSelect={handlePageSelect}
            onSelectionChange={handleSelectionChange}
            assessment={assessment}
            onUpdate={onUpdate}
            onUpdateLastSave={onUpdateLastSave}
          />
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
      activeFeedbackId,
      handleSelectionMade,
      handlePageSelect,
      handleSelectionChange,
      assessment,
      onUpdate,
      onUpdateLastSave,
    ]);

    return (
      <div className="h-full flex">
        <div className="h-full flex bg-background border-r">
          <div className="w-10 flex flex-col">
            <Button
              onClick={() => handleSidebarToggle("files")}
              variant={"outline"}
              className={`flex items-center border-none rounded-none justify-center h-10 w-full transition-colors ${
                sidebarView === "files" ?
                  "bg-primary/5 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              title="Files"
            >
              <Files className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleSidebarToggle("testcases")}
              variant={"outline"}
              className={`flex items-center border-none rounded-none justify-center h-10 w-full transition-colors ${
                sidebarView === "testcases" ?
                  "bg-primary/5 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              title="Test Cases"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            id="sidebar"
            className={cn(isSidebarOpen ? "block" : "hidden")}
            defaultSize={20}
            minSize={15}
            maxSize={25}
          >
            {renderSidebarContent}
          </ResizablePanel>

          <ResizableHandle className={cn(isSidebarOpen ? "block" : "hidden")} />

          <ResizablePanel id="file" defaultSize={isSidebarOpen ? 60 : 70}>
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
                    {isHighlightMode ? "Adding Feedback" : "Add Feedback"}
                  </Button>
                </div>
              </div>

              {/* File Viewer */}
              <div className="grid overflow-auto">{renderFileViewer}</div>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            id="feedback"
            defaultSize={isSidebarOpen ? 20 : 30}
            minSize={15}
            maxSize={30}
          >
            <Tabs
              value={feedbackViewMode}
              onValueChange={(v) => setFeedbackViewMode(v as "file" | "criterion")}
              className="flex flex-col h-full pt-2 px-2"
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
                  assessment={assessment}
                  selectedFeedbackIndex={activeFeedbackId}
                  onSelect={handleFeedbackClick}
                  isAddingFeedback={isHighlightMode}
                  onCancelAdd={handleCancelSelection}
                  rubricCriteria={rubricCriteria}
                  locationData={locationData}
                  onUpdate={onUpdate}
                  byFile={true}
                  currentFile={selectedFile}
                  currentCriterion={""}
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
                  selectedFeedbackIndex={activeFeedbackId}
                  onSelect={handleFeedbackClick}
                  assessment={assessment}
                  isAddingFeedback={isHighlightMode && feedbackViewMode === "criterion"}
                  onCancelAdd={handleCancelSelection}
                  rubricCriteria={rubricCriteria}
                  locationData={locationData}
                  onUpdate={onUpdate}
                  byFile={false}
                  currentFile={selectedFile}
                  currentCriterion={activeScoringTab}
                />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  },
);
export default React.memo(MainWorkspace);
