import type { Rubric } from "@/types/rubric";
import * as ChatService from "@/services/chat-service";
import React, { useState } from "react";
import RubricTable from "./rubric-table";
import ChatInterface from "@/components/app/chat-interface";
import { UserChatPrompt } from "@/types/chat";

interface ChatWindowProps {
  rubric: Rubric;
  onUpdate: (rubric: Rubric) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ rubric, onUpdate }) => {
  const [isApplyingEdit, setIsApplyingEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (chatPrompt: UserChatPrompt) => {
    setIsLoading(true);
    try {
      const response = await ChatService.sendRubricMessage({
        ...chatPrompt,
        rubric,
      });

      if (response.rubric) {
        setIsApplyingEdit(true);

        setTimeout(() => {
          setIsApplyingEdit(false);
        }, 2000);

        onUpdate({
          ...rubric,
          ...response.rubric,
        });
      }

      return response.message;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full w-full">
      <div className="grid grid-cols-7 w-full space-x-4">
        <div className="col-span-3">
          <ChatInterface sendMessageCallback={handleSendMessage} />
        </div>

        {rubric && (
          <div className="col-span-4">
            <RubricTable
              isApplyingEdit={isApplyingEdit}
              rubricData={rubric}
              onUpdate={onUpdate}
              disableEdit={isLoading}
              canEdit
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
