import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Upload } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type ChatMessage = {
  message: string;
  who: "user" | "agent";
};

export default function AIChat() {
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const response = {
        message: "aaaa",
      };

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
    }
  };

  return (
    <div className="flex justify-center items-center size-full">
      <motion.div
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex flex-col justify-center rounded-2xl w-[80%] h-full"
      >
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: hasStarted ? "768px" : "0%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={cn(
            "overflow-y-auto px-2 md:px-4 py-4",
            hasStarted && "border rounded-lg",
          )}
        >
          <div className="space-y-4">
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
                    <div
                      className={cn(
                        "inline-block rounded-2xl px-4 py-2 text-sm transition-all",
                        message.who === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
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
          </div>
          <div ref={messagesEndRef} />
        </motion.div>

        <div className="border dark:bg-input/30 rounded-lg mx-auto mt-2 w-full">
          <Textarea
            id="chat-input"
            placeholder="Ask anything"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isLoading && inputMessage.trim()) {
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
              disabled={isLoading}
              aria-label="Upload file"
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-4 w-4" />
              </label>
            </Button>
            <Button
              onClick={handleSendMessage}
              size="icon"
              disabled={isLoading || !inputMessage.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Input
              type="file"
              className="hidden"
              id="file-upload"
              onChange={handleFileUpload}
              disabled={isLoading}
              accept=".txt,.pdf,.doc,.docx"
              aria-label="File upload"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
