import type { Rubric } from "@/types/rubric";
import { ChatService } from "@/services/chat-service";
import { useCallback, useState } from "react";
import ChatRubricTable from "./chat-rubric-table";
import { ChatInterface } from "@/components/app/chat-interface";
import { ChatMessage } from "@/types/chat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";

interface EditRubricPageProps {
  rubric: Rubric;
  onUpdate: (rubric: Partial<Rubric>) => Promise<void>;
}

export default function ChatWindow({ rubric, onUpdate }: EditRubricPageProps) {
  const [isApplyingEdit, setIsApplyingEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const handleSendMessage = useCallback(
    async (messages: ChatMessage[]) => {
      setIsLoading(true);
      try {
        const token = await auth.getToken();
        if (!token) {
          throw new Error("Unauthorized: No token found");
        }

        const response = await ChatService.sendRubricMessage(
          messages,
          {
            ...rubric,
            weightInRange: "false",
          },
          token,
        );

        if (response.rubric) {
          setIsApplyingEdit(true);

          setTimeout(() => {
            setIsApplyingEdit(false);
          }, 1500);

          onUpdate(response.rubric);
        }

        return response.message;
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [auth, rubric, onUpdate],
  );

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
