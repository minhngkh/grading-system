import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { UserChatPrompt } from "@/types/chat";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Upload, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type ChatMessage = {
  message: string;
  who: "user" | "agent";
  files?: UploadedFile[];
};

type UploadedFile = {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
};

type AIChatProps = {
  sendMessageCallback: (response: UserChatPrompt) => Promise<string>;
  className?: string;
};

export default function ChatInterface({ sendMessageCallback, className }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;

    setIsLoading(true);

    // Add message with files if any
    const newMessage: ChatMessage = {
      message: inputMessage,
      who: "user",
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };
    setMessages((prev) => [...prev, newMessage]);

    // Clear input and files
    setInputMessage("");
    setUploadedFiles([]);

    try {
      // Handle the response from the agent
      const agentResponse = await sendMessageCallback?.({
        prompt: newMessage.message,
        files: newMessage.files?.map((file) => file.file),
      });

      setMessages((prev) => [...prev, { message: agentResponse, who: "agent" }]);
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
    const files = event.target.files;
    if (files) {
      addFiles(Array.from(files));
    }
  };

  const addFiles = (files: File[]) => {
    const newFiles = files.map((file) => {
      const id = Math.random().toString(36).substring(2);
      const isImage = file.type.startsWith("image/");

      const fileObj: UploadedFile = {
        id,
        file,
        type: isImage ? "image" : "document",
      };

      if (isImage) {
        fileObj.preview = URL.createObjectURL(file);
      }

      return fileObj;
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const filtered = prev.filter((file) => file.id !== id);

      // Revoke object URLs to prevent memory leaks
      const removedFile = prev.find((file) => file.id === id);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }

      return filtered;
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      addFiles(files);
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, []);

  return (
    <div className={cn("relative flex flex-col h-full w-full", className)}>
      <ScrollArea className="w-full px-2 md:px-4 py-4 border rounded-md h-[calc(70vh-64px)] mb-[120px]">
        {messages.length === 0 && (
          <div className="mt-32 flex flex-col items-center justify-center text-center h-full">
            <div className="text-3xl font-semibold mb-2">Welcome to AI Chat</div>
            <p className="text-muted-foreground mb-4">
              Ask any question to get started with your conversation
            </p>
            <div className="text-sm text-muted-foreground">
              You can also upload documents for more context
            </div>
          </div>
        )}
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
                  {message.files && message.files.length > 0 && (
                    <div
                      className={cn(
                        "flex flex-wrap gap-2 mb-2",
                        message.who === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      {message.files.map((file) => (
                        <div
                          key={file.id}
                          className={cn(
                            "rounded-md overflow-hidden",
                            message.who === "user" ? "bg-primary/10" : "bg-muted/50",
                          )}
                        >
                          {file.type === "image" && file.preview ? (
                            <img
                              src={file.preview}
                              alt={file.file.name}
                              className="max-h-32 object-cover border rounded-lg overflow-hidden"
                            />
                          ) : (
                            <div className="px-3 py-2 flex items-center gap-2 border rounded-lg overflow-hidden">
                              <span className="text-xs font-medium">
                                {file.file.name}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {message.message && (
                    <div
                      className={cn(
                        "flex",
                        message.who === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "inline-block rounded-lg px-4 py-2 text-sm transition-all",
                          message.who === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        {message.message}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-muted/60 rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="z-10 border bg-background dark:bg-input mx-auto w-full absolute bottom-0 left-0 right-0 rounded-md">
        {uploadedFiles.length > 0 && (
          <div className="p-2 w-full max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="relative group border dark:border-white rounded-md py-1 px-1 flex items-center gap-2"
                >
                  {file.type === "image" && file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="h-8 w-8 object-cover rounded"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-accent dark:bg-foreground flex items-center justify-center rounded">
                      <span className="text-xs text-black">
                        {file.file.name.split(".").pop()}
                      </span>
                    </div>
                  )}
                  <span className="text-xs truncate max-w-[100px]">{file.file.name}</span>
                  <button
                    className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <Textarea
          id="chat-input"
          ref={textareaRef}
          placeholder="Ask anything or paste images"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isLoading && inputMessage.trim()) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          aria-label="Chat input"
          className="max-h-64 overflow-y-auto dark:bg-transparent resize-none transition-all shadow-none focus-visible:ring-0 border-0 focus-visible:ring-offset-0 p-4"
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
            accept="image/*,.txt,.pdf,.doc,.docx"
            multiple
            aria-label="File upload"
          />
        </div>
      </div>
    </div>
  );
}
