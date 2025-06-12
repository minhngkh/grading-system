import { ChatInterface } from "@/components/app/chat-interface";
import { ChatService } from "@/services/chat-service";
import { ChatMessage } from "@/types/chat";
import { useAuth } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";

export const Route = createFileRoute("/_authenticated/chat")({
  component: RouteComponent,
});

function RouteComponent() {
  const auth = useAuth();
  const handleSendMessage = useCallback(
    async (messages: ChatMessage[]) => {
      const token = await auth.getToken();
      if (!token) {
        throw new Error("Unauthorized: No token found");
      }

      const agentResponse = await ChatService.sendChatMessage(messages, token);
      return agentResponse.message;
    },
    [auth],
  );

  return (
    <div className="flex justify-center items-center h-full w-full">
      <ChatInterface sendMessageCallback={handleSendMessage} />
    </div>
  );
}
