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
  title: string;
  emptyText: string;
  allFeedbacks: FeedbackItem[]; // để lấy index toàn cục
}

export const FeedbackListPanel: React.FC<FeedbackListPanelProps> = ({
  feedbacks,
  selectedFeedbackIndex,
  onSelect,
  onDelete,
  title,
  emptyText,
  allFeedbacks,
}) => (
  <>
    <h3 className="text-sm font-medium mb-3">
      {title} ({feedbacks.length})
    </h3>
    <div className="space-y-3">
      {feedbacks.length > 0 ?
        feedbacks.map((feedback) => {
          const globalIndex = allFeedbacks.findIndex((fb) => fb === feedback);
          const isActive = selectedFeedbackIndex === globalIndex;
          return (
            <div
              key={globalIndex}
              className={
                "border rounded-lg p-2 hover:bg-muted cursor-pointer transition-all duration-200 hover:shadow-sm flex items-start gap-2 " +
                (isActive ? "bg-secondary border-blue-300" : "")
              }
              onClick={() => onSelect(feedback, globalIndex)}
            >
              <Badge className={`text-xs ${getTagColor(feedback.tag)}`}>
                {feedback.tag}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {feedback.criterion}
                  </span>
                  <span className="text-xs text-gray-500">
                    L{feedback.fromLine}-{feedback.toLine}
                  </span>
                  <Trash
                    className="h-4 w-4 text-gray-500 cursor-pointer hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(globalIndex);
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{feedback.comment}</p>
              </div>
            </div>
          );
        })
      : <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{emptyText}</p>
        </div>
      }
    </div>
  </>
);
