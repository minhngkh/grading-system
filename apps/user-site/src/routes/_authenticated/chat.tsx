import ChatInterface from "@/components/app/chat-interface";
import { sendChatMessage } from "@/services/chat-service";
import { UserChatPrompt } from "@/types/chat";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/chat")({
  component: RouteComponent,
});

function RouteComponent() {
  const handleSendMessage = async (chatPrompt: UserChatPrompt) => {
    // Handle sending the chat message
    const agentResponse = await sendChatMessage(chatPrompt);
    return agentResponse.message;
  };

  return (
    <div className="flex justify-center items-center h-full w-full">
      <ChatInterface sendMessageCallback={handleSendMessage} />
    </div>
  );
}
