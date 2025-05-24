import type { Rubric } from "@/types/rubric";
import * as ChatService from "@/services/chat-service";
import React, { useState } from "react";
import ChatRubricTable from "./chat-rubric-table";
import ChatInterface from "@/components/app/chat-interface";
import { UserChatPrompt } from "@/types/chat";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChatWindowProps {
  rubric: Rubric;
  onUpdate: (rubric: Partial<Rubric>) => void;
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

        onUpdate(response.rubric);
      }

      return response.message;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lg:grid lg:grid-cols-7 space-y-4 lg:space-y-0 size-full gap-4">
      <div className="flex justify-end lg:hidden">
        <Dialog>
          <DialogTrigger asChild>
            <Button>View Rubric</Button>
          </DialogTrigger>
          <DialogContent className="p-8">
            <DialogTitle className="text-lg font-semibold">Current rubric</DialogTitle>
            <ChatRubricTable
              isApplyingEdit={isApplyingEdit}
              rubricData={rubric}
              onUpdate={onUpdate}
              disableEdit={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-[70vh] lg:h-full lg:col-span-3">
        <ChatInterface sendMessageCallback={handleSendMessage} />
      </div>

      <div className="h-[40vh] hidden lg:block lg:h-full lg:col-span-4">
        <ChatRubricTable
          isApplyingEdit={isApplyingEdit}
          rubricData={rubric}
          onUpdate={onUpdate}
          disableEdit={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
