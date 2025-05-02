import type { Message } from "@/types/chat";
import type { Rubric } from "@/types/rubric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import * as ChatService from "@/services/chatService";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Upload } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import RubricTable from "./rubric-table";

interface ChatWindowProps {
  rubric: Rubric;
  onUpdate: (rubric: Rubric) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ rubric, onUpdate }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamResponse = async (messageContent: string) => {
    setIsLoading(false);
    setIsStreaming(true);
    const newMessage: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    try {
      const response = await ChatService.sendMessage(messageContent);
      switch (response.type) {
        case "chat": {
          const reader = response.data.getReader();
          let fullResponse = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            fullResponse += value.content;
            setMessages((prev) =>
              prev.map((msg, idx) =>
                idx === prev.length - 1 ? { ...msg, content: fullResponse } : msg,
              ),
            );
          }

          setMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1 ? { ...msg, isStreaming: false } : msg,
            ),
          );

          break;
        }

        case "rubric": {
          const MOCK_RESPONSE = "Your rubric has been updated";
          const rubric = response.data;
          onUpdate(rubric);
          setMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1
                ? { ...msg, isStreaming: false, content: MOCK_RESPONSE }
                : msg,
            ),
          );

          break;
        }
      }
    } catch (error) {
      console.error("Error streaming response:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    if (!hasStarted) {
      setHasStarted(true);
    }

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    await streamResponse(inputMessage);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await ChatService.uploadFile(file);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-full w-full">
      <div className="flex justify-center items-center gap-4 w-full">
        <motion.div
          animate={{
            width: rubric ? "40%" : "80%",
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative flex flex-col justify-center h-[600px] rounded-2xl"
        >
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: hasStarted ? "100%" : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <ScrollArea
              className={cn(
                "h-full px-2 md:px-4 py-4",
                hasStarted && "border rounded-lg",
              )}
            >
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "flex mb-4",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%]",
                        message.role === "user" ? "text-right" : "text-left",
                      )}
                    >
                      <div
                        className={cn(
                          "inline-block rounded-2xl px-4 py-2 text-sm transition-all",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/60",
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start mb-4"
                  >
                    <div className="bg-muted/60 rounded-2xl px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </ScrollArea>
          </motion.div>

          <div className="border dark:bg-input/30 rounded-lg mx-auto mt-2 w-full ">
            <Textarea
              id="chat"
              placeholder="Ask me to create a rubric for your assignment..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !isStreaming &&
                  !isLoading &&
                  inputMessage.trim()
                ) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="resize-none transition-all shadow-none focus-visible:ring-0 border-0 focus-visible:ring-offset-0 p-4"
            />
            <div className="flex gap-2 px-2 pb-2 justify-end">
              <Button
                variant="ghost"
                size="icon"
                asChild
                disabled={isLoading || isStreaming}
              >
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                </label>
              </Button>
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={isLoading || isStreaming || !inputMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={handleFileUpload}
                disabled={isLoading || isStreaming}
              />
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {rubric && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "60%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="h-[600px]"
            >
              <RubricTable rubricData={rubric} onUpdate={onUpdate} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatWindow;
