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
} from "lucide-react";
import { Assessment, AssessmentSchema, FeedbackItem } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import { GradingAttempt } from "@/types/grading";
import FileViewer from "./viewer/file-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/clerk-react";
import { AssessmentService } from "@/services/assessment-service";
import { toast } from "sonner";
import { getFileIcon } from "./icon-utils";
import { FileExplorer } from "@/components/app/file-explorer";
import { ScoringPanel } from "./scoring-panel";
import { ExportDialog } from "@/components/app/export-dialog";
import { AssessmentExporter } from "@/lib/exporters";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FeedbackListPanel } from "./feedback-list-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileService } from "@/services/file-service";

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
    resolver: zodResolver(AssessmentSchema),
    defaultValues: assessment,
    mode: "onChange",
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
  const [activeScoringTab, setActiveScoringTab] = useState<string>(
    rubric.criteria[0]?.name || "",
  );
  const [feedbackViewMode, setFeedbackViewMode] = useState<"file" | "criterion">("file");
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
  // Đảm bảo chỉ set initialData đúng 1 lần duy nhất khi vào trang (không update lại sau này)
  useEffect(() => {
    if (initialData === null) {
      setInitialData({
        scoreBreakdowns: assessment.scoreBreakdowns,
        feedbacks: assessment.feedbacks,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ phụ thuộc files để đảm bảo đã load xong file

  const totalScore = formData.scoreBreakdowns.reduce((sum, breakdown) => {
    const criterion = rubric.criteria.find((c) => c.name === breakdown.criterionName);
    const weight = criterion?.weight || 0;
    const scale = grading.scaleFactor ?? 10;
    return sum + ((breakdown.rawScore / weight) * (weight * scale)) / 100;
  }, 0);

  // Add feedback handler (toggle highlight mode)
  const handleAddFeedbackClick = () => {
    setIsHighlightMode((prev) => !prev);
    setSelectedFeedback(null);
  };

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

  const handleAddNewFeedback = (newFeedback: FeedbackItem) => {
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

      toast.success("Score updated successfully");
    } catch (err) {
      toast.error("Failed to update score");
      console.error(err);
    }
  };

  const handleExport = () => {
    if (isDirty) {
      toast.warning("You have unsaved changes. Please save before exporting.");
      return;
    }
    setOpen(true);
  };
  // Render file content with line numbers and highlights

  // Handle mouse down on resize handle
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
    console.log("Rendering file content for:", selectedFile);
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
        onHighlightComplete={() => setIsHighlightMode(false)}
        activeFeedbackId={selectedFeedbackId}
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

  return (
    <div className="-mb-20 -mt-12 h-[92vh] max-h-[100vh] min-w-250 relative flex flex-col bg-background text-foreground overflow-auto ">
      {/* Header with fixed height */}
      <div className="p-4" style={{ height: "72px" }}>
        <div className="flex items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
              className="p-2"
            >
              {isFileExplorerOpen ?
                <PanelLeftClose className="h-4 w-4" />
              : <PanelLeftOpen className="h-4 w-4" />}
            </Button>
            <div>
              <div className="flex">
                <h1 className="text-xl font-bold">
                  {formData.submissionReference} Score: {totalScore.toFixed(1)}/
                  {grading.scaleFactor}
                </h1>
                <span className="text-xl font-bold"></span>
              </div>

              <p className="text-sm text-gray-500">Rubric: {rubric.rubricName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowBottomPanel((v) => !v)}>
              {showBottomPanel ?
                <EyeClosed className="h-4 w-4 mr-2" />
              : <Eye className="h-4 w-4 mr-2" />}
              {showBottomPanel ? "Hide Scoring" : "Show Scoring"}
            </Button>
            <Button onClick={handleExport} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Export
            </Button>
            <ExportDialog
              open={open}
              onOpenChange={setOpen}
              exporterClass={AssessmentExporter}
              args={[formData]}
            />
            <Button
              className="cursor-pointer"
              size="sm"
              onClick={handleRevertAdjustment}
              disabled={!canRevert}
            >
              <History className="h-4 w-4 mr-2" />
              Revert Changes
            </Button>
            <Button className="cursor-pointer" size="sm" onClick={handleSaveFeedback}>
              <Save className="h-4 w-4 mr-2" />
              Save Feedback
            </Button>
            <Button className="cursor-pointer" size="sm" onClick={handleSaveScore}>
              <Save className="h-4 w-4 mr-2" />
              Save Scoring
            </Button>
          </div>
        </div>
      </div>

      <div
        className="flex justify-between"
        style={{
          height:
            showBottomPanel ?
              `calc(100% - 72px - ${bottomPanelHeight}px)`
            : "calc(100% - 72px - 20px)",
          minHeight: 0,
        }}
      >
        {/* File Explorer với width cố định */}
        {isFileExplorerOpen && files.length > 0 && (
          <FileExplorer
            files={files}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            expandedFolders={expandedFolders}
            setExpandedFolders={setExpandedFolders}
            feedbacks={formData.feedbacks}
            grading={grading}
          />
        )}

        {/* Main Content + Feedback Panel */}
        <div className="flex-1 flex flex-row" style={{ minWidth: 0 }}>
          {/* File Viewer - không cần điều chỉnh height, luôn 100% */}
          <div
            className="flex-1 flex flex-col h-full w-80"
            style={{
              minWidth: 0,
              position: "relative",
            }}
          >
            <div className="mt-2 border-b flex-shrink-0">
              <div className="flex mb-2 items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedFile && getFileIcon(selectedFile)}
                  <h2 className="text-lg font-medium">
                    {selectedFile?.name || "No file selected"}
                  </h2>
                  <Badge variant="outline">{selectedFile?.type}</Badge>
                </div>
                <Button
                  variant={isHighlightMode ? "default" : "outline"}
                  size="sm"
                  className={isHighlightMode ? "bg-blue-600 text-white" : ""}
                  onClick={handleAddFeedbackClick}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {isHighlightMode ? "Exit Feedback" : "Add Feedback"}
                </Button>
              </div>
              {isHighlightMode && selectedFile && (
                <div className="mt-2 text-blue-700 text-sm font-medium">
                  {(selectedFile.type === "code" || selectedFile.type === "essay") &&
                    "Click and drag to highlight and add feedback. Click again to exit."}
                </div>
              )}
            </div>
            {(
              selectedFile &&
              (selectedFile.type === "code" || selectedFile.type === "essay")
            ) ?
              renderFileContent()
            : <div className="flex-1 w-full overflow-auto">{renderFileContent()}</div>}
          </div>

          <div className="ml-4 w-60 pt-4 flex flex-col h-full">
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
                <h3 className="text-sm font-medium mb-3 shrink-0">
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
                <h3 className="text-sm font-medium mb-3">
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
        </div>
      </div>

      {/* ScoringPanel với vị trí tuyệt đối, chiếm toàn bộ chiều rộng trang */}
      {showBottomPanel && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: bottomPanelHeight,
            zIndex: 20,
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
          />
        </div>
      )}

      {/* Replace custom dialog with Shadcn Dialog */}
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
