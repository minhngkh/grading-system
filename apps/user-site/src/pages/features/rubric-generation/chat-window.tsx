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

type ChatMessage = {
  message: string;
  who: "user" | "agent";
};

const ChatWindow: React.FC<ChatWindowProps> = ({ rubric, onUpdate }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isApplyingEdit, setIsApplyingEdit] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (!hasStarted) {
      setHasStarted(true);
    }

    setIsLoading(true);
    setInputMessage("");

    setMessages((prev) => [...prev, { message: inputMessage, who: "user" }]);

    try {
      const response = await ChatService.sendMessage({
        prompt: inputMessage,
        rubric,
      });
      if (response.rubric) {
        setIsApplyingEdit(true);
        setTimeout(() => {
          setIsApplyingEdit(false);
        }, 2000);
        onUpdate(response.rubric);
      }

      setMessages((prev) => [...prev, { message: response.message, who: "agent" }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          message: "An error occurred while processing your request.",
          who: "agent",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadError(null);
      try {
        await ChatService.uploadFile(file);
        setMessages((prev) => [
          ...prev,
          {
            message: `File "${file.name}" uploaded successfully`,
            who: "agent",
          },
        ]);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error uploading file";
        setUploadError(errorMessage);
        setMessages((prev) => [
          ...prev,
          {
            message: `Failed to upload file: ${errorMessage}`,
            who: "agent",
          },
        ]);
      } finally {
        setIsUploading(false);
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
                      message.who === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div className="max-w-[80%]">
                      <div className="inline-block rounded-2xl px-4 py-2 text-sm transition-all bg-muted">
                        {message.message}
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

          <div className="border dark:bg-input/30 rounded-lg mx-auto mt-2 w-full">
            <Textarea
              id="chat-input"
              placeholder="Ask me to create a rubric for your assignment..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !isLoading &&
                  !isUploading &&
                  inputMessage.trim()
                ) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              aria-label="Chat input"
              className="dark:bg-transparent resize-none transition-all shadow-none focus-visible:ring-0 border-0 focus-visible:ring-offset-0 p-4"
            />
            <div className="flex gap-2 px-2 pb-2 justify-end">
              <Button
                variant="ghost"
                size="icon"
                asChild
                disabled={isLoading || isUploading}
                aria-label="Upload file"
              >
                <label htmlFor="file-upload" className="cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </label>
              </Button>
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={isLoading || isUploading || !inputMessage.trim()}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={handleFileUpload}
                disabled={isLoading || isUploading}
                accept=".txt,.pdf,.doc,.docx"
                aria-label="File upload"
              />
            </div>
            {uploadError && (
              <p className="text-destructive text-sm px-4 pb-2">{uploadError}</p>
            )}
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
              <RubricTable
                isApplyingEdit={isApplyingEdit}
                rubricData={rubric}
                onUpdate={onUpdate}
                disableEdit={isLoading}
                canEdit
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatWindow;
