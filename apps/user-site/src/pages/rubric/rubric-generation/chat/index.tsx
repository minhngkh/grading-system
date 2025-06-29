import type { Rubric } from "@/types/rubric";
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
import { useMutation } from "@tanstack/react-query";
import { sendRubricMessageMutationOptions } from "@/queries/chat-queries";
import { updateRubricMutationOptions } from "@/queries/rubric-queries";
interface EditRubricPageProps {
  rubric: Rubric;
  onUpdate: (rubric: Partial<Rubric>) => Promise<void>;
}

export default function ChatWindow({ rubric, onUpdate }: EditRubricPageProps) {
  const [isApplyingEdit, setIsApplyingEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const chatMutation = useMutation(sendRubricMessageMutationOptions(rubric, auth));
  const updateRubricMutation = useMutation(updateRubricMutationOptions(rubric.id, auth));

  const handleSendMessage = useCallback(
    async (messages: ChatMessage[]) => {
      try {
        setIsLoading(true);
        const response = await chatMutation.mutateAsync(messages);

        if (response.rubric) {
          setIsApplyingEdit(true);

          setTimeout(async () => {
            try {
              await updateRubricMutation.mutateAsync({
                ...response.rubric,
              });

              onUpdate({ ...response.rubric });
            } catch (error) {
              console.error("Error updating rubric:", error);
              return "Error updating rubric. Please try again.";
            }
            setIsApplyingEdit(false);
          }, 1500);
        }

        return response.message;
      } catch (error) {
        console.error("Error sending message:", error);
        return "An error occurred while processing your request. Please try again.";
      } finally {
        setIsLoading(false);
      }
    },
    [auth, rubric, onUpdate, chatMutation],
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
