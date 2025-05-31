import type { Rubric } from "@/types/rubric";
import { ChatService } from "@/services/chat-service";
import { useState } from "react";
import ChatRubricTable from "./chat-rubric-table";
import ChatInterface from "@/components/app/chat-interface";
import { UserChatPrompt } from "@/types/chat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatWindowProps {
  rubric: Rubric;
  onUpdate: (rubric: Partial<Rubric>) => void;
}

export default function ChatWindow({ rubric, onUpdate }: ChatWindowProps) {
  const [isApplyingEdit, setIsApplyingEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (chatPrompt: UserChatPrompt) => {
    setIsLoading(true);
    try {
      const response = await ChatService.sendRubricMessage({
        ...chatPrompt,
        rubric: {
          rubricName: rubric.rubricName,
          tags: rubric.tags,
          criteria: rubric.criteria,
        },
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
      toast.error("An error occurred while processing your request. Please try again.");
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
          <DialogContent
            className="flex flex-col min-h-[90vh] min-w-[90vw]"
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle className="text-lg">Rubric Details</DialogTitle>
            </DialogHeader>
            <div className="flex-1 grid">
              <ChatRubricTable
                isApplyingEdit={isApplyingEdit}
                rubricData={rubric}
                onUpdate={onUpdate}
                disableEdit={isLoading}
              />
            </div>
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
}
