import React, { useEffect, useState } from "react";
import equal from "fast-deep-equal";
import {
  Save,
  Eye,
  Edit3,
  PanelLeftClose,
  PanelLeftOpen,
  EyeClosed,
  History,
  ArrowLeft,
  Files,
  MessageSquare,
  Code,
} from "lucide-react";
import { Assessment, FeedbackItem } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import FileViewer from "./viewer/file-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useAuth } from "@clerk/clerk-react";
import { AssessmentService } from "@/services/assessment-service";
import { toast } from "sonner";
import { getFileIcon } from "./icon-utils";
import { FileExplorer } from "@/components/app/file-explorer";
import { ScoringPanel } from "@/components/app/scoring-panel";
import { ExportDialog } from "@/components/app/export-dialog";
import { AssessmentExporter } from "@/lib/exporters";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FeedbackListPanel } from "@/components/app/feedback-list-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileService } from "@/services/file-service";
import { ScoreAdjustmentDialog } from "@/components/app/score-adjustment-dialog";
import { useNavigate } from "@tanstack/react-router";

export function EditAssessmentUI({
  assessment,
  grading,
  rubric,
}: {
  assessment: Assessment;
  grading: GradingAttempt;
  rubric: Rubric;
}) {
  const form = useForm<Assessment>({
    defaultValues: assessment,
    mode: "onChange" as const,
  });

  const formData = form.watch();
  const [initialData, setInitialData] = useState<{
    scoreBreakdowns: Assessment["scoreBreakdowns"];
    feedbacks: Assessment["feedbacks"];
  } | null>(null);
  // isDirty chỉ so sánh với lần lưu gần nhất (không phải initialData)
  const [lastSavedData, setLastSavedData] = useState<{
    scoreBreakdowns: Assessment["scoreBreakdowns"];
    feedbacks: Assessment["feedbacks"];
  } | null>(null);

  // Add state for revert confirmation dialog
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);

  // Khi mount lần đầu, lastSavedData và initialData là dữ liệu gốc
  useEffect(() => {
    if (lastSavedData === null) {
      const initialState = {
        scoreBreakdowns: assessment.scoreBreakdowns,
        feedbacks: assessment.feedbacks,
      };
      setLastSavedData(initialState);
      setInitialData(initialState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // isDirty so sánh với lastSavedData
  const isDirty =
    lastSavedData !== null &&
    (!equal(formData.scoreBreakdowns, lastSavedData.scoreBreakdowns) ||
      !equal(formData.feedbacks, lastSavedData.feedbacks));

  // Calculate if revert is possible (compare current with initial)
  const canRevert =
    initialData !== null &&
    (!equal(formData.scoreBreakdowns, initialData.scoreBreakdowns) ||
      !equal(formData.feedbacks, initialData.feedbacks));

  const [files, setFiles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    tests: true,
  });
  const [activeTab, setActiveTab] = useState("scoring");
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [canAddFeedback, setCanAddFeedback] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [hasTextSelection, setHasTextSelection] = useState(false);
  const [activeScoringTab, setActiveScoringTab] = useState<string>(
    rubric.criteria[0]?.name || "",
  );
  const [feedbackViewMode, setFeedbackViewMode] = useState<"file" | "criterion">("file");
  const [scoreAdjustment, setScoreAdjustment] = useState<any[]>([]);
  const [lastScoreSaveTime, setLastScoreSaveTime] = useState<number>(0);
  const [showScoreAdjustmentDialog, setShowScoreAdjustmentDialog] = useState(false);
  const navigate = useNavigate();
  const [sidebarView, setSidebarView] = useState<"files" | "testcases" | "feedback">(
    "files",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default width: 320px (48px icons + 272px content)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);

  useEffect(() => {
    async function load() {
      const items = await FileService.loadFileItems(
        `${grading.id}/${formData.submissionReference}`,
      );
      setFiles(items);
      setSelectedFile(items[0] || null);
    }

    if (formData.submissionReference) load();
  }, [formData.submissionReference, grading.id]);
  console.log(files);
  // Đảm bảo chỉ set initialData đúng 1 lần duy nhất khi vào trang (không update lại sau này)
  useEffect(() => {
    if (initialData === null) {
      setInitialData({
        scoreBreakdowns: assessment.scoreBreakdowns,
        feedbacks: assessment.feedbacks,
      });
    }
  }, []);

  const handleAddFeedbackClick = () => {
    if (isHighlightMode) {
      // Cancel highlight mode - clear all states
      setIsHighlightMode(false);
      setCanAddFeedback(false);
      setHasTextSelection(false);
      setSelectedPage(null);
    } else if (canAddFeedback || selectedPage) {
      // User has made selection, trigger the add feedback mode
      setIsHighlightMode(true);
    }
    setSelectedFeedback(null);
  };

  // Reset feedback states when file changes
  useEffect(() => {
    setCanAddFeedback(false);
    setSelectedPage(null);
    setIsHighlightMode(false);
  }, [selectedFile]);

  const handleUpdateScore = (criterionName: string, newScore: number) => {
    const criterion = rubric.criteria.find((c) => c.name === criterionName);
    if (!criterion) return;

    let matchedLevel = criterion.levels
      .filter((l) => l.weight <= newScore)
      .sort((a, b) => b.weight - a.weight)[0];

    if (!matchedLevel && criterion.levels.length > 0) {
      matchedLevel = criterion.levels.reduce(
        (min, l) => (l.weight < min.weight ? l : min),
        criterion.levels[0],
      );
    }

    const updated = formData.scoreBreakdowns.map((sb) =>
      sb.criterionName === criterionName ?
        {
          ...sb,
          performanceTag: matchedLevel ? matchedLevel.tag : "",
          rawScore: (newScore * (criterion.weight ?? 0)) / 100,
        }
      : sb,
    );

    form.setValue("scoreBreakdowns", updated, { shouldValidate: true });
  };
  const isFeedbackForFile = (fb: FeedbackItem, file: any) => {
    try {
      if (fb.fileRef && file.relativePath && fb.fileRef.endsWith(file.relativePath))
        return true;
    } catch {}
    return false;
  };

  const handleUpdateFeedback = (
    index: number,
    updatedFeedback: Partial<FeedbackItem>,
  ) => {
    const currentFeedbacks = [...formData.feedbacks];

    if (index >= 0 && index < currentFeedbacks.length) {
      currentFeedbacks[index] = {
        ...currentFeedbacks[index],
        ...updatedFeedback,
      };

      form.setValue("feedbacks", currentFeedbacks, { shouldValidate: true });
      return true;
    }

    return false;
  };

  function generateUID() {
    const first = (Math.random() * 46656) | 0;
    const second = (Math.random() * 46656) | 0;
    const part1 = ("000" + first.toString(36)).slice(-3);
    const part2 = ("000" + second.toString(36)).slice(-3);
    return (part1 + part2).toUpperCase();
  }

  const handleAddNewFeedback = (newFeedback: FeedbackItem) => {
    newFeedback.id = generateUID(); // Generate a unique ID for the new feedback
    const currentFeedbacks = [...formData.feedbacks];
    currentFeedbacks.push(newFeedback);

    form.setValue("feedbacks", currentFeedbacks, { shouldValidate: true });
    // Use the new feedback's ID instead of array index
    setSelectedFeedbackId(newFeedback.id ?? null);
    setSelectedFeedback(newFeedback);

    return newFeedback.id;
  };

  const handleDeleteFeedback = (feedbackId: string) => {
    const current = formData.feedbacks;
    const updated = current.filter((f) => f.id !== feedbackId);
    form.setValue("feedbacks", updated, { shouldValidate: true });

    // Clear selection if deleted feedback was selected
    if (selectedFeedbackId === feedbackId) {
      setSelectedFeedbackId(null);
      setSelectedFeedback(null);
    }
  };

  const handleSaveFeedback = async () => {
    try {
      const token = await auth.getToken();
      if (!token) {
        throw new Error("You must be logged in to update feedback");
      }

      // Check if feedback has actually changed
      if (lastSavedData && equal(formData.feedbacks, lastSavedData.feedbacks)) {
        toast.info("No changes to save feedback.");
        return;
      }

      await AssessmentService.updateFeedback(assessment.id, formData.feedbacks, token);

      // Update lastSavedData and initialData with the current feedback values
      if (lastSavedData) {
        setLastSavedData({
          ...lastSavedData,
          feedbacks: form.getValues("feedbacks"),
        });
      }

      if (initialData) {
        setInitialData({
          ...initialData,
          feedbacks: form.getValues("feedbacks"),
        });
      }

      toast.success("Feedback updated successfully");
    } catch (err) {
      toast.error("Failed to update feedback");
      console.error(err);
    }
  };

  const handleSaveScore = async () => {
    try {
      const token = await auth.getToken();
      if (!token) {
        throw new Error("You must be logged in to update score");
      }

      // Check if score has actually changed
      if (
        lastSavedData &&
        equal(formData.scoreBreakdowns, lastSavedData.scoreBreakdowns)
      ) {
        toast.info("No changes to save score.");
        return;
      }

      await AssessmentService.updateScore(assessment.id, formData.scoreBreakdowns, token);

      // Update lastSavedData and initialData with the current score values
      if (lastSavedData) {
        setLastSavedData({
          ...lastSavedData,
          scoreBreakdowns: form.getValues("scoreBreakdowns"),
        });
      }

      if (initialData) {
        setInitialData({
          ...initialData,
          scoreBreakdowns: form.getValues("scoreBreakdowns"),
        });
      }

      // Trigger score adjustment fetch by updating timestamp
      setLastScoreSaveTime(Date.now());

      toast.success("Score updated successfully");
    } catch (err) {
      toast.error("Failed to update score");
      console.error(err);
    }
  };

  // useEffect to fetch score adjustment after saving score
  useEffect(() => {
    const fetchScoreAdjustment = async () => {
      try {
        const token = await auth.getToken();
        if (!token) {
          console.error("No authentication token available");
          return;
        }

        const adjustmentData = await AssessmentService.getScoreAdjustments(
          assessment.id,
          token,
        );

        // Make sure we're setting the full array, not just one element
        if (Array.isArray(adjustmentData)) {
          setScoreAdjustment(adjustmentData);
        } else {
          console.warn("Adjustment data is not an array:", adjustmentData);
          setScoreAdjustment([]);
        }
      } catch (error) {
        console.error("Failed to fetch score adjustment:", error);
        setScoreAdjustment([]);
      }
    };

    // Fetch on initial load
    fetchScoreAdjustment();
  }, [assessment.id]);

  // Separate useEffect to refetch after score saves
  useEffect(() => {
    if (lastScoreSaveTime === 0) return; // Skip initial render

    const fetchScoreAdjustmentAfterSave = async () => {
      try {
        const token = await auth.getToken();
        if (!token) {
          console.error("No authentication token available");
          return;
        }

        console.log("Refetching score adjustment after save...");
        const adjustmentData = await AssessmentService.getScoreAdjustments(
          assessment.id,
          token,
        );
        console.log("Refetched score adjustment data:", adjustmentData);

        if (Array.isArray(adjustmentData)) {
          setScoreAdjustment(adjustmentData);
        } else {
          setScoreAdjustment([]);
        }
      } catch (error) {
        console.error("Failed to refetch score adjustment:", error);
      }
    };

    fetchScoreAdjustmentAfterSave();
  }, [lastScoreSaveTime, assessment.id]);

  const handleExport = () => {
    if (isDirty) {
      toast.warning("You have unsaved changes. Please save before exporting.");
      return;
    }
    setOpen(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const containerRect = document
      .querySelector(".flex.flex-col.bg-background")
      ?.getBoundingClientRect();
    if (!containerRect) return;

    const minHeight = 120;
    const maxHeight = containerRect.height * 0.6;

    const newHeight = containerRect.bottom - e.clientY;

    const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);

    if (Math.abs(clampedHeight - bottomPanelHeight) > 2) {
      setBottomPanelHeight(clampedHeight);
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add event listeners
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // Handle sidebar resize
  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    setIsResizingSidebar(true);
    setDragStartX(e.clientX);
    setDragStartWidth(sidebarWidth);
    e.preventDefault();
  };

  const handleSidebarMouseMove = (e: MouseEvent) => {
    if (!isResizingSidebar) return;

    const minWidth = 200; // Minimum width: 48px icons + 152px content
    const maxWidth = 600; // Maximum width

    const deltaX = e.clientX - dragStartX;
    const newWidth = dragStartWidth + deltaX;
    const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);

    setSidebarWidth(clampedWidth);
  };

  const handleSidebarMouseUp = () => {
    setIsResizingSidebar(false);
  };

  // Add event listeners for sidebar resize
  React.useEffect(() => {
    if (isResizingSidebar) {
      document.addEventListener("mousemove", handleSidebarMouseMove);
      document.addEventListener("mouseup", handleSidebarMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleSidebarMouseMove);
      document.removeEventListener("mouseup", handleSidebarMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleSidebarMouseMove);
      document.removeEventListener("mouseup", handleSidebarMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingSidebar]);

  const handleFeedbackSelect = (feedback: FeedbackItem) => {
    if (selectedFeedback && selectedFeedback.id === feedback.id) {
      setSelectedFeedback(null);
      setSelectedFeedbackId(null);
      return;
    }
    const file = files.find((f) => isFeedbackForFile(feedback, f));
    if (file) setSelectedFile(file);
    setSelectedFeedback(feedback);
    setSelectedFeedbackId(feedback.id ?? null);
  };

  // Hàm chuẩn hóa feedback giống code-viewer

  useEffect(() => {
    if (!initialData) {
      setInitialData({
        scoreBreakdowns: formData.scoreBreakdowns,
        feedbacks: formData.feedbacks,
      });
    }
  }, [files, formData.feedbacks]);

  const renderFileContent = () => {
    if (!selectedFile) return <div className="text-gray-400 p-8">No file selected</div>;
    let prefix = assessment.submissionReference;
    const underscoreIdx = prefix.indexOf("_");
    if (underscoreIdx !== -1) {
      prefix = prefix.substring(0, underscoreIdx);
    }
    if (!prefix.endsWith("/")) {
      prefix += "/";
    }
    const fileFeedbacks = formData.feedbacks.filter((fb) =>
      isFeedbackForFile(fb, selectedFile),
    );
    return (
      <FileViewer
        rubricCriteria={rubric.criteria.map((c) => c.name)}
        gradingId={grading.id}
        submissionReference={formData.submissionReference}
        file={selectedFile}
        feedbacks={fileFeedbacks}
        feedbacksAll={formData.feedbacks}
        addFeedback={handleAddNewFeedback}
        updateFeedback={handleUpdateFeedback}
        isHighlightMode={isHighlightMode}
        onHighlightComplete={() => {
          setIsHighlightMode(false);
          setHasTextSelection(false);
          setCanAddFeedback(false);
          setSelectedPage(null); // Also clear page selection when highlighting is complete
        }}
        activeFeedbackId={selectedFeedbackId}
        onFeedbackValidated={handleFeedbackValidated}
        onSelectionMade={() => {
          setHasTextSelection(true);
          setCanAddFeedback(true);
        }}
        onPageClick={(page) => setSelectedPage(page)}
        onPageClear={() => setSelectedPage(null)}
      />
    );
  };

  // Khi revert, trả về đúng dữ liệu gốc ban đầu
  const handleRevertAdjustment = () => {
    if (!initialData || !canRevert) return;
    setRevertDialogOpen(true);
  };

  // Function to actually perform the revert after confirmation
  const confirmRevert = () => {
    if (!initialData) return;
    form.setValue("scoreBreakdowns", initialData.scoreBreakdowns, {
      shouldValidate: true,
    });
    form.setValue("feedbacks", initialData.feedbacks, { shouldValidate: true });
    form.reset({
      ...form.getValues(),
      scoreBreakdowns: initialData.scoreBreakdowns,
      feedbacks: initialData.feedbacks,
    });
    setRevertDialogOpen(false);
    toast.success("Reverted to saved data.");
  };

  function handleShowScoreAdjustments(): void {
    // No need to fetch fresh data here since we already have up-to-date data
    setShowScoreAdjustmentDialog(true);
  }

  // Handle feedback validation from viewers
  const handleFeedbackValidated = React.useCallback(() => {
    // Update both initialData and lastSavedData with current validated state
    const currentState = {
      scoreBreakdowns: form.getValues("scoreBreakdowns"),
      feedbacks: form.getValues("feedbacks"),
    };

    setInitialData(currentState);
    setLastSavedData(currentState);
  }, [form]);

  const handleBackClick = () => {
    navigate({
      to: "/gradings/$gradingId/result",
      params: { gradingId: grading.id },
    });
  };

  const renderSidebarContent = () => {
    switch (sidebarView) {
      case "files":
        return (
          <FileExplorer
            files={files}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            expandedFolders={expandedFolders}
            setExpandedFolders={setExpandedFolders}
            feedbacks={formData.feedbacks}
            grading={grading}
          />
        );
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
                  Feedback for {selectedFile?.name}
                </h3>
                <FeedbackListPanel
                  feedbacks={formData.feedbacks.filter((f) => {
                    const fileRefName = f.fileRef?.split("/").pop();
                    return fileRefName === selectedFile?.name;
                  })}
                  selectedFeedbackId={selectedFeedbackId}
                  onSelect={handleFeedbackSelect}
                  onDelete={handleDeleteFeedback}
                  allFeedbacks={formData.feedbacks}
                  updateFeedback={handleUpdateFeedback}
                />
              </TabsContent>
              <TabsContent
                value="criterion"
                className="flex flex-col flex-1 overflow-hidden"
              >
                <h3 className="text-xs font-medium mb-3">
                  Feedback for {activeScoringTab}
                </h3>
                <FeedbackListPanel
                  feedbacks={formData.feedbacks.filter(
                    (f) => f.criterion === activeScoringTab,
                  )}
                  selectedFeedbackId={selectedFeedbackId}
                  onSelect={handleFeedbackSelect}
                  onDelete={handleDeleteFeedback}
                  allFeedbacks={formData.feedbacks}
                  activeCriterion={activeScoringTab}
                  addFeedback={handleAddNewFeedback}
                  updateFeedback={handleUpdateFeedback}
                />
              </TabsContent>
            </Tabs>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex flex-col bg-background text-foreground size-full gap-8">
      <div className="flex items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleBackClick}
            title="Back to results"
            className="size-8 p-0 flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              Assessment: {assessment.submissionReference}
            </h1>
            <p className="text-sm text-muted-foreground">
              Grading ID: {grading.name} - Rubric: {rubric.rubricName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canRevert && (
            <Button size="sm" onClick={handleRevertAdjustment}>
              <History className="h-4 w-4" />
              <span className="text-xs">Revert Changes</span>
            </Button>
          )}
          <Button size="sm" onClick={() => setShowBottomPanel((v) => !v)}>
            {showBottomPanel ?
              <EyeClosed className="h-4 w-4" />
            : <Eye className="h-4 w-4" />}
            <span className="text-xs">
              {showBottomPanel ? "Hide Scoring" : "Show Scoring"}
            </span>
          </Button>
          <Button onClick={handleExport} size="sm">
            <Save className="h-4 w-4" />
            <span className="text-xs">Export</span>
          </Button>
          <ExportDialog
            open={open}
            onOpenChange={setOpen}
            exporterClass={AssessmentExporter}
            args={[formData, grading]}
          />
          <Button className="cursor-pointer" size="sm" onClick={handleSaveFeedback}>
            <Save className="h-4 w-4" />
            <span className="text-xs">Save Feedback</span>
          </Button>
          <Button className="cursor-pointer" size="sm" onClick={handleSaveScore}>
            <Save className="h-4 w-4" />
            <span className="text-xs">Save Scoring</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 justify-between border rounded-md overflow-hidden">
        {isFileExplorerOpen && files.length > 0 && isSidebarOpen && (
          <div className="flex h-full border-r relative" style={{ width: sidebarWidth }}>
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
            </div>

            {/* Sidebar Content */}
            <div
              className="flex-1 flex flex-col h-full"
              style={{ width: sidebarWidth - 48 }}
            >
              {renderSidebarContent()}
            </div>

            {/* Resize Handle */}
            <div
              className={`absolute top-0 right-0 w-1 h-full hover:bg-blue-400 cursor-ew-resize transition-colors duration-200 ${
                isResizingSidebar && "bg-blue-500"
              }`}
              onMouseDown={handleSidebarMouseDown}
            >
              <div className="h-full flex items-center justify-center">
                <div className="w-0.5 h-12 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {isFileExplorerOpen && files.length > 0 && !isSidebarOpen && (
          <div className="flex items-start pt-2 pl-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center justify-center h-8 w-8 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50 border"
              title="Open Sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col h-full" style={{ minWidth: 0 }}>
          <div
            className="flex-1 flex flex-col h-full"
            style={{ minWidth: 0, position: "relative" }}
          >
            <div className="border-b flex-shrink-0 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedFile && getFileIcon(selectedFile)}
                  <h2 className="text-sm font-medium">
                    {selectedFile?.name || "No file selected"}
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    {selectedFile?.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {/* Show Add Feedback button based on file type and conditions */}
                  {selectedFile && (
                    <>
                      {/* For code/essay files: show workflow */}
                      {(selectedFile.type === "code" ||
                        selectedFile.type === "essay") && (
                        <Button
                          variant={
                            isHighlightMode ? "destructive"
                            : canAddFeedback ?
                              "default"
                            : "outline"
                          }
                          size="sm"
                          onClick={handleAddFeedbackClick}
                          disabled={!isHighlightMode && !canAddFeedback}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          <span className="text-xs">
                            {isHighlightMode ?
                              "Cancel"
                            : canAddFeedback ?
                              "Add Feedback"
                            : "Select Text First"}
                          </span>
                        </Button>
                      )}

                      {/* For PDF files: show after page click */}
                      {selectedFile.type === "pdf" && (
                        <Button
                          variant={
                            isHighlightMode ? "destructive"
                            : selectedPage !== null ?
                              "default"
                            : "outline"
                          }
                          size="sm"
                          onClick={handleAddFeedbackClick}
                          disabled={!isHighlightMode && selectedPage === null}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          <span className="text-xs">
                            {isHighlightMode ?
                              "Cancel"
                            : selectedPage !== null ?
                              `Add Feedback (Page ${selectedPage})`
                            : "Click Page First"}
                          </span>
                        </Button>
                      )}

                      {/* For other file types: original behavior */}
                      {selectedFile.type !== "code" &&
                        selectedFile.type !== "essay" &&
                        selectedFile.type !== "pdf" && (
                          <Button
                            variant={isHighlightMode ? "destructive" : "outline"}
                            size="sm"
                            onClick={handleAddFeedbackClick}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            <span className="text-xs">
                              {isHighlightMode ? "Cancel" : "Add Feedback"}
                            </span>
                          </Button>
                        )}
                    </>
                  )}
                </div>
              </div>
              {selectedFile && !isHighlightMode && (
                <div className="mt-2 text-blue-700 text-xs font-medium">
                  {isHighlightMode &&
                    (selectedFile.type === "code" || selectedFile.type === "essay") &&
                    "Fill the form to add feedback, or click Cancel to exit."}
                  {isHighlightMode &&
                    selectedFile.type === "pdf" &&
                    selectedPage !== null &&
                    `Adding feedback to page ${selectedPage}. Fill the form or click Cancel.`}
                  {!isHighlightMode &&
                    (selectedFile.type === "code" || selectedFile.type === "essay") &&
                    !canAddFeedback &&
                    "Drag to select text, then click Add Feedback."}
                  {!isHighlightMode &&
                    (selectedFile.type === "code" || selectedFile.type === "essay") &&
                    canAddFeedback &&
                    "Text selected. Click Add Feedback to proceed."}
                  {!isHighlightMode &&
                    selectedFile.type === "pdf" &&
                    selectedPage !== null &&
                    `Page ${selectedPage} selected. Click Add Feedback to proceed.`}
                  {!isHighlightMode &&
                    selectedFile.type === "pdf" &&
                    selectedPage === null &&
                    "Click on a page first, then click Add Feedback."}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto">{renderFileContent()}</div>
          </div>
        </div>
      </div>

      {showBottomPanel && (
        <div
          className="border rounded-b-md overflow-hidden"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: bottomPanelHeight,
            borderTop: "1px solid var(--border-color, #e5e7eb)",
          }}
        >
          <ScoringPanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeScoringTab={activeScoringTab}
            setActiveScoringTab={setActiveScoringTab}
            rubric={rubric}
            grading={grading}
            formData={formData}
            isResizing={isResizing}
            handleMouseDown={handleMouseDown}
            updateScore={handleUpdateScore}
            addFeedback={handleAddNewFeedback}
            updateFeedback={handleUpdateFeedback}
            feedbacks={formData.feedbacks}
            onShowScoreAdjustments={handleShowScoreAdjustments}
          />
        </div>
      )}

      {/* Score Adjustment Dialog */}
      <ScoreAdjustmentDialog
        scaleFactor={grading.scaleFactor ?? 10}
        open={showScoreAdjustmentDialog}
        onOpenChange={setShowScoreAdjustmentDialog}
        scoreAdjustment={scoreAdjustment}
      />

      {/* Revert confirmation dialog */}
      <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Revert</DialogTitle>
            <DialogDescription>
              Are you sure you want to revert to the last saved state? All current changes
              will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRevertDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRevert}>
              Revert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
