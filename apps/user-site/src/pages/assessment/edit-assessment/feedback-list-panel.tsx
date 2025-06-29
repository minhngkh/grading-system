import React from "react";
import { FeedbackItem } from "@/types/assessment";
import { Badge } from "@/components/ui/badge";
import { Trash, MessageSquare } from "lucide-react";
import { getTagColor } from "./icon-utils";

interface FeedbackListPanelProps {
  feedbacks: FeedbackItem[];
  selectedFeedbackIndex: number | null;
  onSelect: (feedback: FeedbackItem, index: number) => void;
  onDelete: (index: number) => void;
  allFeedbacks: FeedbackItem[];
}

export const FeedbackListPanel: React.FC<FeedbackListPanelProps> = ({
  feedbacks,
  selectedFeedbackIndex,
  onSelect,
  onDelete,
  allFeedbacks,
}) => {
  return (
    <>
      <div className="h-full space-y-2 overflow-auto">
        {feedbacks.length > 0 ?
          feedbacks.map((feedback) => {
            const globalIndex = allFeedbacks.findIndex((fb) => fb === feedback);
            const isActive = selectedFeedbackIndex === globalIndex;
            return (
              <div
                key={globalIndex}
                className={
                  `border rounded-lg p-2 hover:bg-primary-foreground cursor-pointer transition-all duration-200 hover:shadow-sm flex items-start gap-2 ` +
                  (isActive ? `bg-primary-foreground` : "")
                }
                onClick={() => {
                  onSelect(feedback, globalIndex);
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {feedback.criterion}
                    </span>
                    <span className="text-xs text-gray-500">
                      {feedback.locationData?.type === "text" &&
                        `L${feedback.locationData.fromLine}-${feedback.locationData.toLine}`}
                      {feedback.locationData?.type === "pdf" &&
                        `Page ${feedback.locationData.page}`}
                      {feedback.locationData?.type === "image" && `Image`}
                    </span>
                    <Trash
                      className="h-4 w-4 text-gray-500 cursor-pointer hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(globalIndex);
                      }}
                    />
                  </div>
                  <Badge
                    className={`${getTagColor(feedback.tag)} text-accent-foreground`}
                  >
                    {feedback.tag}
                  </Badge>

                  <p className="text-xs text-muted-foreground break-words whitespace-pre-wrap">
                    {feedback.comment}
                  </p>
                </div>
              </div>
            );
          })
        : <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">There is no feedback</p>
          </div>
        }
      </div>
    </>
  );
};
