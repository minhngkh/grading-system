import ChatInterface from "@/components/app/chat-interface";
import { ChatService } from "@/services/chat-service";
import { ChatMessage } from "@/types/chat";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/chat")({
  component: RouteComponent,
});

function RouteComponent() {
  const handleSendMessage = async (messages: ChatMessage[]) => {
    const agentResponse = await ChatService.sendChatMessage(messages);
    return agentResponse.message;
  };

  return (
    <div className="flex justify-center items-center h-full w-full">
      <ChatInterface sendMessageCallback={handleSendMessage} />
    </div>
  );
}
