import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestResult from "./test-result";
import { useState, useMemo } from "react";
import { FileIcon, Highlighter, MenuIcon, MessageSquare, Trash2 } from "lucide-react";
import HighlightableViewer from "./viewer/highlightable-viewer";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Assessment } from "@/types/assessment";
import { Rubric } from "@/types/rubric";
import PDFViewer from "./viewer/pdf-view";

export interface AssignmentViewerProps {
  assessment: Assessment;
  setAssessment: React.Dispatch<React.SetStateAction<Assessment>>;
  rubric: Rubric;
}

const AssignmentViewer = ({
  assessment,
  setAssessment,
  rubric,
}: AssignmentViewerProps) => {
  // Lấy danh sách file từ feedbacks
  const files = Array.from(new Set(assessment.feedbacks.map((fb) => fb.fileRef)));
  const [activeTab, setActiveTab] = useState("submission");
  const [selectedFile, setSelectedFile] = useState(files[0] || "");
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  // Lọc feedbacks theo file đang chọn
  const selectedFileFeedbacks = useMemo(
    () => assessment.feedbacks.filter((fb) => fb.fileRef === selectedFile),
    [assessment.feedbacks, selectedFile],
  );

  // Lấy nội dung file (ở đây chỉ có 1 file, mock)
  const fileContent = "File content is not available in mock data.";

  // Thêm feedback mới cho criterion (dựa trên criterion của feedback đầu tiên trong newFeedbacks)
  const handleFeedbackUpdate = (newFeedbacks: any[]) => {
    if (!newFeedbacks.length) return;
    const criterion = newFeedbacks[0].criterion;
    setAssessment((prev) => ({
      ...prev,
      feedbacks: [
        ...prev.feedbacks.filter((fb) => fb.criterion !== criterion),
        ...newFeedbacks,
      ],
    }));
  };

  const toggleHighlightMode = () => setIsHighlightMode((prev) => !prev);

  const handleFeedbackClick = (feedbackId: string) => {
    setActiveFeedbackId((prev) => (prev === feedbackId ? null : feedbackId));
  };

  const handleDeleteFeedback = (feedbackId: string) => {
    setAssessment((prev) => ({
      ...prev,
      feedbacks: prev.feedbacks.filter((fb) => fb.id !== feedbackId),
    }));
    if (activeFeedbackId === feedbackId) setActiveFeedbackId(null);
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
        <TabsTrigger value="submission" className="p-2 flex-1 cursor-pointer">
          Submission
        </TabsTrigger>
        <TabsTrigger value="feedback" className="p-2 flex-1 cursor-pointer">
          Feedback Overview
        </TabsTrigger>
      </TabsList>
      <div className="flex">
        <div className="px-3 w-full">
          <TabsContent value="submission" className="border rounded shadow h-[56vh] flex">
            <div className="w-3/4 border-r pr-2 overflow-y-auto flex flex-col relative">
              <div className="flex items-center gap-2 px-2 py-2 border-b bg-background sticky top-0 z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <MenuIcon className="w-4 h-4" />
                      File
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    {files.map((name) => (
                      <DropdownMenuItem
                        key={name}
                        onClick={() => setSelectedFile(name)}
                        className={`flex items-center gap-2 cursor-pointer ${
                          selectedFile === name ? "bg-accent" : ""
                        }`}
                      >
                        <FileIcon className="w-4 h-4" />
                        <span className="text-sm">{name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex-1">
                <HighlightableViewer
                  type="essay"
                  content={fileContent}
                  feedbacks={selectedFileFeedbacks}
                  updateFeedback={handleFeedbackUpdate}
                  isHighlightMode={isHighlightMode}
                  onHighlightComplete={() => setIsHighlightMode(false)}
                  activeFeedbackId={activeFeedbackId}
                />
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
                  selectedFileFeedbacks.map((feedback, idx) => (
                    <div
                      key={feedback.id || idx}
                      className={`flex p-2 rounded-md cursor-pointer text-sm gap-1 items-start ${
                        activeFeedbackId === (feedback.id || feedback.comment)
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleFeedbackClick(feedback.id || feedback.comment)}
                    >
                      <MessageSquare className="w-4 h-4 mt-1.25 mr-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          Lines {feedback.fromLine + 1}-{feedback.toLine + 1}
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
                          e.stopPropagation();
                          handleDeleteFeedback(feedback.id || feedback.comment);
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
            value="feedback"
            className="p-2 border rounded shadow h-[51vh] overflow-auto"
          >
            <div className="space-y-4">
              {rubric.criteria.map((criterion) => (
                <div className="space-y-2" key={criterion.name}>
                  <div>
                    <strong>Criterion:</strong> {criterion.name}
                  </div>
                  <div>
                    <strong>Feedback:</strong>
                    <ul className="list-disc ml-4">
                      {assessment.feedbacks
                        .filter((fb) => fb.criterion === criterion.name)
                        .map((fb, idx) => (
                          <li key={fb.comment + idx}>
                            {fb.comment}{" "}
                            <Badge
                              variant="outline"
                              className={`ml-2 ${getBadgeClass(fb.tag)}`}
                            >
                              {fb.tag}
                            </Badge>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </div>
      </div>
      <PDFViewer />
    </Tabs>
  );
};

export default AssignmentViewer;
