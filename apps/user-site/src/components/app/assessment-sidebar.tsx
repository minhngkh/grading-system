import React, { useState, useCallback, useMemo } from "react";
import { Files, MessageSquare, Code, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileExplorer } from "@/components/app/file-explorer";
import { FeedbackListPanel } from "@/components/app/feedback-list-panel";
import { Assessment, FeedbackItem } from "@/types/assessment";
import { GradingAttempt } from "@/types/grading";
import { UseFormReturn } from "react-hook-form";

interface AssessmentSidebarProps {
  files: any[];
  selectedFile: any;
  onFileSelect: (file: any) => void;
  assessment: Assessment;
  grading: GradingAttempt;
  activeScoringTab: string;
  onClose: () => void;
  form: UseFormReturn<Assessment>;
  rubricCriteria?: string[];
}

export const AssessmentSidebar: React.FC<AssessmentSidebarProps> = ({
  files,
  selectedFile,
  onFileSelect,
  assessment,
  grading,
  activeScoringTab,
  onClose,
  form,
  rubricCriteria = [],
}) => {
  const [sidebarView, setSidebarView] = useState<"files" | "testcases" | "feedback">(
    "files",
  );
  const [feedbackViewMode, setFeedbackViewMode] = useState<"file" | "criterion">("file");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    tests: true,
  });
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  const handleFeedbackSelect = useCallback(
    (feedback: FeedbackItem) => {
      if (!feedback?.id) {
        console.warn("Invalid feedback object:", feedback);
        return;
      }

      if (selectedFeedbackId === feedback.id) {
        setSelectedFeedbackId(null);
        return;
      }

      // Auto switch to the file containing this feedback
      const feedbackFile = files.find(
        (f) =>
          feedback.fileRef?.includes(f.relativePath) ||
          feedback.fileRef?.includes(f.name),
      );
      console.log("Feedback file:", feedbackFile);
      if (feedbackFile) {
        onFileSelect(feedbackFile);
      }

      setSelectedFeedbackId(feedback.id);
      console.log("Selected feedback:", feedback);
    },
    [selectedFeedbackId, files, onFileSelect],
  );

  // Memoize filtered feedbacks for performance
  const fileFeedbacks = useMemo(() => {
    if (!selectedFile || !assessment?.feedbacks) return [];

    return assessment.feedbacks.filter((f) => {
      const fileRefName = f.fileRef?.split("/").pop();
      return fileRefName === selectedFile?.name;
    });
  }, [selectedFile, assessment?.feedbacks]);

  const criterionFeedbacks = useMemo(() => {
    if (!activeScoringTab || !assessment?.feedbacks) return [];

    return assessment.feedbacks.filter((f) => f.criterion === activeScoringTab);
  }, [activeScoringTab, assessment?.feedbacks]);

  const renderSidebarContent = () => {
    switch (sidebarView) {
      case "files":
        return (
          <FileExplorer
            files={files}
            selectedFile={selectedFile}
            setSelectedFile={onFileSelect}
            expandedFolders={expandedFolders}
            setExpandedFolders={setExpandedFolders}
            feedbacks={assessment.feedbacks}
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
          <div className="p-2 h-full">
            <Tabs
              value={feedbackViewMode}
              onValueChange={(v) => setFeedbackViewMode(v as "file" | "criterion")}
              className="flex flex-col h-full"
            >
              <TabsList className="text-xs font-medium rounded-md shrink-0">
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
                  feedbacks={fileFeedbacks}
                  selectedFeedbackId={selectedFeedbackId}
                  onSelect={handleFeedbackSelect}
                  assessment={assessment}
                  form={form}
                  rubricCriteria={rubricCriteria}
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
                  feedbacks={criterionFeedbacks}
                  selectedFeedbackId={selectedFeedbackId}
                  onSelect={handleFeedbackSelect}
                  assessment={assessment}
                  form={form}
                  rubricCriteria={rubricCriteria}
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

        <button
          onClick={onClose}
          className="flex items-center justify-center h-10 w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Close Sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">{renderSidebarContent()}</div>
    </div>
  );
};
