import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { encodeFileToBase64Async } from "@/lib/file-encoder";
import { cn } from "@/lib/utils";
import { ChatMessage, UploadedFile } from "@/types/chat";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Upload, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { toast } from "sonner";

const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
  MAX_COUNT: 10, // Limit number of files
} as const;

const TEXTAREA_CONFIG = {
  MAX_HEIGHT: 200,
  ROWS: 1,
} as const;

interface AIChatProps {
  sendMessageCallback: (messages: ChatMessage[]) => Promise<string | undefined>;
  className?: string;
  isRubricChat?: boolean;
  placeholder?: string;
}

const ChatInterface = memo(function ChatInterface({
  sendMessageCallback,
  className,
  placeholder = "Ask anything",
}: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized file validation
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    if (file.size > FILE_CONFIG.MAX_SIZE) {
      return { isValid: false, error: `${file.name} exceeds the 10MB limit` };
    }

    if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
      return { isValid: false, error: `${file.name} has an unsupported file type` };
    }

    return { isValid: true };
  }, []);

  // Optimized scroll to bottom
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Optimized message sending
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const newMessage: ChatMessage = {
      message: inputMessage,
      who: "user",
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };

    const newMessages = [...messages, newMessage];

    setMessages(newMessages);

    // Clear input immediately for better UX
    setInputMessage("");
    setUploadedFiles([]);

    try {
      const agentResponse = await sendMessageCallback(newMessages);
      console.log("Agent response:", agentResponse);

      if (controller.signal.aborted) return;

      if (!agentResponse) {
        throw new Error("No response from agent");
      }

      const responseMessage: ChatMessage = {
        message: agentResponse,
        who: "agent",
      };

      setMessages((prev) => [...prev, responseMessage]);
    } catch (error) {
      if (controller.signal.aborted) return;
      setMessages((prev) => [
        ...prev,
        {
          message:
            "I apologize, but I encountered an error while processing your request. Please try again.",
          who: "agent",
        },
      ]);

      console.error("Error sending message:", error);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [inputMessage, messages, sendMessageCallback, uploadedFiles, isLoading]);

  // Optimized file processing
  const processFiles = useCallback(
    async (files: File[]) => {
      if (uploadedFiles.length + files.length > FILE_CONFIG.MAX_COUNT) {
        toast.error("Too many files", {
          description: `Maximum ${FILE_CONFIG.MAX_COUNT} files allowed`,
        });
        return;
      }

      const validFiles: File[] = [];

      for (const file of files) {
        const validation = validateFile(file);
        if (validation.isValid) {
          validFiles.push(file);
        } else {
          toast.error("Invalid file", { description: validation.error });
        }
      }

      if (validFiles.length === 0) return;

      try {
        const newFiles = await Promise.all(
          validFiles.map(async (file) => {
            const id = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
            const isImage = file.type.startsWith("image/");

            const url = await encodeFileToBase64Async(file);
            const fileObj: UploadedFile = {
              id,
              file,
              type: isImage ? "image" : "document",
              url,
            };

            if (isImage) {
              try {
                fileObj.preview = URL.createObjectURL(file);
              } catch (error) {
                console.error("Failed to create preview:", error);
              }
            }

            return fileObj;
          }),
        );

        setUploadedFiles((prev) => [...prev, ...newFiles]);
      } catch (error) {
        toast.error("Upload failed", {
          description: "Could not process the uploaded files",
        });
      }
    },
    [uploadedFiles.length, validateFile],
  );

  // File upload handler
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        await processFiles(Array.from(files));
      }
      // Clear input to allow same file upload
      if (event.target) {
        event.target.value = "";
      }
    },
    [processFiles],
  );

  // Optimized file removal
  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((file) => file.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((file) => file.id !== id);
    });
  }, []);

  // Enhanced paste handler
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
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
        e.preventDefault();
        processFiles(files);
      }
    },
    [processFiles],
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles],
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !isLoading && inputMessage.trim()) {
        e.preventDefault();
        handleSendMessage();
      } else if (e.key === "Escape" && isLoading) {
        abortControllerRef.current?.abort();
        setIsLoading(false);
      }
    },
    [inputMessage, isLoading, handleSendMessage],
  );

  useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });

      abortControllerRef.current?.abort();
    };
  }, []);

  const FilePreview = useMemo(() => {
    return uploadedFiles.map((file) => (
      <div
        key={file.id}
        className="relative overflow-hidden group border dark:border-white dark:hover:border-transparent rounded-md py-1 px-1 flex items-center gap-2"
      >
        {file.type === "image" && file.preview ?
          <img
            src={file.preview}
            alt={file.file.name}
            className="h-8 w-8 object-cover rounded"
            loading="lazy"
          />
        : <div className="h-8 w-8 bg-accent dark:bg-foreground flex items-center justify-center rounded">
            <span className="text-xs text-black font-semibold">
              {file.file.name.split(".").pop()?.toUpperCase()}
            </span>
          </div>
        }
        <span className="text-xs truncate max-w-[100px]" title={file.file.name}>
          {file.file.name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="z-10 absolute size-full right-0 top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity p-0 bg-red-500 hover:bg-red-500 text-white hover:text-white"
          onClick={() => removeFile(file.id)}
          aria-label={`Remove ${file.file.name}`}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    ));
  }, [uploadedFiles, removeFile]);

  const canSend = inputMessage.trim() && !isLoading;

  return (
    <div
      className={cn("flex flex-col h-full w-full", className)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-50">
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-primary font-medium">Drop files here to upload</p>
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        <div className="size-full overflow-y-auto absolute top-0 left-0 right-0 px-2 md:px-4 py-4 border rounded-md">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="text-3xl font-semibold mb-2">
                Welcome to your AI assistant
              </div>
              <p className="text-muted-foreground mb-4">
                Ask any question to get started with your conversation
              </p>
              <div className="text-sm text-muted-foreground">
                You can also upload documents or drag & drop files for more context
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
                  transition={{ duration: 0.3 }}
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
                            {file.type === "image" && file.preview ?
                              <img
                                src={file.preview}
                                alt={file.file.name}
                                className="max-h-32 object-cover border rounded-lg overflow-hidden"
                                loading="lazy"
                              />
                            : <div className="px-3 py-2 flex items-center gap-2 border rounded-lg overflow-hidden">
                                <span
                                  className="text-xs font-medium"
                                  title={file.file.name}
                                >
                                  {file.file.name}
                                </span>
                              </div>
                            }
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
                            "inline-block rounded-lg px-4 py-2 text-sm transition-all whitespace-pre-wrap",
                            message.who === "user" ?
                              "bg-primary text-primary-foreground"
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
                  <div className="bg-muted/60 rounded-lg px-4 py-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="relative z-10 bg-background dark:bg-input mx-auto w-full mt-32">
        <div className="absolute bottom-0 left-0 right-0 border rounded-md bg-background dark:bg-input">
          {uploadedFiles.length > 0 && (
            <div className="p-2 w-full max-h-32 overflow-y-auto border-b">
              <div className="flex flex-wrap gap-2">{FilePreview}</div>
            </div>
          )}

          <Textarea
            placeholder={placeholder}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            rows={TEXTAREA_CONFIG.ROWS}
            className="max-h-48 overflow-y-auto dark:bg-transparent resize-none transition-all shadow-none focus-visible:ring-0 border-0 focus-visible:ring-offset-0 p-4"
            aria-label="Chat input"
          />

          <div className="flex gap-2 px-2 pb-2 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || uploadedFiles.length >= FILE_CONFIG.MAX_COUNT}
              aria-label="Upload file"
              title={`Upload file (max ${FILE_CONFIG.MAX_COUNT})`}
            >
              <Upload className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleSendMessage}
              size="icon"
              disabled={!canSend}
              aria-label="Send message"
              title="Send message (Enter)"
            >
              {isLoading ?
                <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />}
            </Button>

            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isLoading}
              accept="image/*,.txt,.pdf,.doc,.docx"
              multiple
              aria-label="File upload"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export { ChatInterface };
