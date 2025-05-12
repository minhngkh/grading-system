import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestResult from "./test-result";
import { useEffect, useState } from "react";
import {
  Code,
  FileIcon,
  Highlighter,
  MenuIcon,
  MessageSquare,
  Trash2,
} from "lucide-react";
import {
  TestCase,
  SubmissionBreakdown1,
  Feedback,
  GradingResult,
} from "@/types/submission";

import CodeHighlighter from "./viewer/code-viewer";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { EssayHighlighter } from "./viewer/essay-viewer";
import { Badge } from "@/components/ui/badge";

export interface AssignmentViewerProps {
  breakdowns: SubmissionBreakdown1[];
  gradingResult: GradingResult;
  setGradingResult: React.Dispatch<React.SetStateAction<GradingResult>>;
  testCases: TestCase[];
  updateFeedback: (criterionId: string, breakdownId: string, feedback: string) => void;
}

const AssignmentViewer = ({
  breakdowns,
  gradingResult,
  setGradingResult,
  testCases,
  updateFeedback,
}: AssignmentViewerProps) => {
  const getFileName = (fileReference: string | undefined) => {
    if (fileReference) {
      try {
        const url = new URL(fileReference);
        const segments = url.pathname.split("/");
        return segments.pop() ?? "";
      } catch {
        const parts = fileReference.split("/");
        return parts.pop() ?? "";
      }
    }
    return "Unknown file";
  };
  const [activeTab, setActiveTab] = useState("submission");
  const [selectedFile, setSelectedFile] = useState<string>(
    getFileName(breakdowns[0].fileReference),
  );
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  const uniqueFiles = Array.from(
    new Map(
      breakdowns.map((breakdown) => [getFileName(breakdown.fileReference), breakdown]),
    ).values(),
  );

  const selectedFileData = uniqueFiles.find(
    (file) => getFileName(file.fileReference) === selectedFile,
  );

  const renderTabsTrigger = (tabs: { value: string; label: string }[]) =>
    tabs.map(({ value, label }) => (
      <TabsTrigger key={value} value={value} className="p-2 flex-1 cursor-pointer">
        {label}
      </TabsTrigger>
    ));

  const selectedFileFeedbacks =
    gradingResult?.criterionResults
      ?.filter(
        (criterionResult) =>
          criterionResult.criterionId === selectedFileData?.criterionId,
      )
      .flatMap((criterionResult) => criterionResult.feedback) || [];

  const handleFeedbackUpdate = (newFeedbacks: Feedback[]) => {
    setGradingResult((prev) => ({
      ...prev,
      criterionResults: prev.criterionResults.map((criterionResult) =>
        criterionResult.criterionId === selectedFileData?.criterionId
          ? {
              ...criterionResult,
              feedback: [...criterionResult.feedback, ...newFeedbacks], // Append new feedbacks
            }
          : criterionResult,
      ),
    }));
  };

  const toggleHighlightMode = () => {
    setIsHighlightMode((prev) => !prev);
  };

  const handleFeedbackClick = (feedbackId: string) => {
    setActiveFeedbackId((prev) => {
      if (prev === feedbackId) {
        // If the same feedback is clicked again, deactivate it
        document
          .querySelectorAll(`.annotation-span[data-id="${feedbackId}"]`)
          .forEach((el) => el.classList.remove("actived")); // Remove actived class
        return null;
      } else {
        // Activate the clicked feedback
        document
          .querySelectorAll(".annotation-span")
          .forEach((el) => el.classList.remove("actived")); // Remove actived class from all
        document
          .querySelectorAll(`.annotation-span[data-id="${feedbackId}"]`)
          .forEach((el) => el.classList.add("actived")); // Add actived class to selected feedback
        return feedbackId;
      }
    });
  };

  const handleDeleteFeedback = (feedbackId: string) => {
    setGradingResult((prev) => ({
      ...prev,
      criterionResults: prev.criterionResults.map((criterionResult) =>
        criterionResult.criterionId === selectedFileData?.criterionId
          ? {
              ...criterionResult,
              feedback: criterionResult.feedback.filter((fb) => fb.id !== feedbackId),
            }
          : criterionResult,
      ),
    }));
    if (activeFeedbackId === feedbackId) {
      setActiveFeedbackId(null); // Reset active feedback if it was deleted
    }
    document
      .querySelectorAll(`.annotation-span[data-id="${feedbackId}"]`)
      .forEach((el) => el.classList.remove("hovered")); // Remove hovered class from deleted feedback
  };

  const getBadgeClass = (tag: string | undefined) => {
    switch (tag) {
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200";
      case "notice":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200";
      case "tip":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200";
      case "caution":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="flex border-b w-full">
        {renderTabsTrigger([
          { value: "submission", label: "Submission" },
          { value: "test-result", label: "Test Result" },
          { value: "feedback", label: "Feedback Overview" },
        ])}
      </TabsList>

      <div className="flex">
        <div className="px-3 w-full">
          <TabsContent value="submission" className="border rounded shadow h-[56vh] flex">
            <div className="w-3/4 border-r pr-2 overflow-y-auto relative">
              {selectedFileData?.type === "code" ? (
                <CodeHighlighter
                  code={selectedFileData?.processedContent || ""}
                  feedbacks={selectedFileFeedbacks}
                  updateFeedback={handleFeedbackUpdate}
                  isHighlightMode={isHighlightMode} // Pass highlight mode to CodeViewer
                  onHighlightComplete={() => setIsHighlightMode(false)} // Reset highlight mode
                />
              ) : (
                <EssayHighlighter
                  essay={selectedFileData?.processedContent || ""}
                  feedbacks={selectedFileFeedbacks}
                  isHighlightMode={isHighlightMode}
                  onHighlightComplete={() => setIsHighlightMode(false)}
                  updateFeedback={(criterionId, newFeedbacks) => {
                    setGradingResult((prev) => ({
                      ...prev,
                      criterionResults: prev.criterionResults.map((criterionResult) =>
                        criterionResult.criterionId === criterionId
                          ? {
                              ...criterionResult,
                              feedback: [...criterionResult.feedback, ...newFeedbacks],
                            }
                          : criterionResult,
                      ),
                    }));
                  }}
                  criterionId={selectedFileData?.criterionId || ""} // Pass criterionId
                />
              )}
              <div className="absolute top-2 right-2 z-30">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <MenuIcon className="w-4 h-4" />
                        File
                      </Button>
                    </TooltipTrigger>

                    <TooltipContent
                      side="bottom"
                      align="end"
                      className="p-1 bg-popover text-popover-foreground shadow-lg rounded-md w-40"
                    >
                      <ul className="max-h-60 overflow-auto space-y-1">
                        {uniqueFiles.map((file) => {
                          const name = getFileName(file.fileReference);
                          const isSelected = selectedFile === name;
                          return (
                            <li key={name}>
                              <Button
                                variant={isSelected ? "secondary" : "ghost"}
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => setSelectedFile(name)}
                              >
                                {file.type === "code" ? (
                                  <Code className="w-4 h-4 mr-2" />
                                ) : (
                                  <FileIcon className="w-4 h-4 mr-2" />
                                )}
                                <span className="text-sm">{name}</span>
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="w-1/4 my-3 px-3">
              <div className="flex gap-4 justify-between items-center">
                <strong>Feedback</strong>
                <Button
                  className="gap-2"
                  variant={isHighlightMode ? "default" : "outline"}
                  onClick={toggleHighlightMode}
                >
                  <Highlighter className="w-4 h-4" />
                  {isHighlightMode ? "Exit Highlight" : "Add Highlight"}
                </Button>
              </div>
              <p className="mt-3 text-sm font-semibold">
                All Feedbacks ({selectedFileFeedbacks.length})
              </p>
              <div className="space-y-2 max-h-[46vh] overflow-y-auto">
                {selectedFileFeedbacks.length > 0 ? (
                  selectedFileFeedbacks.map((feedback) => (
                    <div
                      key={feedback.id}
                      className={`flex p-2 rounded-md cursor-pointer text-sm gap-1 items-start ${
                        activeFeedbackId === feedback.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleFeedbackClick(feedback.id)}
                    >
                      <MessageSquare className="w-4 h-4 mt-1.25 mr-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          Lines {feedback.DocumentLocation.fromLine + 1}-
                          {feedback.DocumentLocation.toLine + 1}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {feedback.comment}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`px-2 py-1 text-xs font-semibold rounded ${getBadgeClass(
                          feedback.tag,
                        )}`}
                      >
                        {feedback.tag}
                      </Badge>
                      <Trash2
                        className="w-4 h-4 mt-1 text-gray-500 hover:text-red-500 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering feedback click
                          handleDeleteFeedback(feedback.id);
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No feedback available.</p>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent
            value="test-result"
            className="p-2 border rounded shadow h-[51vh] overflow-auto"
          >
            <TestResult content={testCases} />
          </TabsContent>
          <TabsContent
            value="feedback"
            className="p-2 border rounded shadow h-[51vh] overflow-auto"
          >
            <div className="space-y-4">
              {breakdowns.map((breakdown) => {
                const fileRef = breakdown.fileReference;
                return (
                  <div className="space-y-2" key={breakdown.id}>
                    <div>
                      <strong>Targeted File:</strong>{" "}
                      {fileRef ? getFileName(fileRef) : "N/A"}
                    </div>
                    <div>
                      <strong>Feedback:</strong>
                      <textarea
                        className="w-full mt-1 p-2 border rounded"
                        value={
                          gradingResult.criterionResults
                            .find((cr) => cr.criterionId === breakdown.criterionId)
                            ?.feedback.find((fb) => fb.id === breakdown.id)?.comment || ""
                        }
                        onChange={(e) =>
                          updateFeedback(
                            breakdown.criterionId,
                            breakdown.id,
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
};

export default AssignmentViewer;
