import { useCallback, useState } from "react";

import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ChatMessage } from "@/types/chat";
import type { Rubric } from "@/types/rubric";
import { ChatInterface } from "@/components/app/chat-interface";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PluginConfigDialogs } from "@/consts/plugins";
import { sendRubricMessageMutationOptions } from "@/queries/chat-queries";
import { updateRubricMutationOptions } from "@/queries/rubric-queries";
import { PluginService } from "@/services/plugin-service";

import RubricTabs from "./tabs";
interface EditRubricPageProps {
  rubric: Rubric;
  onUpdate: (rubric: Partial<Rubric>) => void;
}

export default function ChatWindow({ rubric, onUpdate }: EditRubricPageProps) {
  const [isApplyingEdit, setIsApplyingEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const chatMutation = useMutation(sendRubricMessageMutationOptions(rubric, auth));
  const updateRubricMutation = useMutation(updateRubricMutationOptions(rubric.id, auth));

  const { mutateAsync: sendMessage } = chatMutation;
  const { mutateAsync: updateRubric } = updateRubricMutation;

  const handleSendMessage = useCallback(
    async (messages: ChatMessage[]) => {
      try {
        setIsLoading(true);
        const response = await sendMessage(messages);

        if (response.rubric) {
          setIsApplyingEdit(true);

          // Auto-configure plugins with default configurations
          const updatedCriteria = [...response.rubric.criteria];
          let needsConfigUpdate = false;

          for (let i = 0; i < updatedCriteria.length; i++) {
            const criterion = updatedCriteria[i];
            // Default to "ai" if no plugin is set
            const pluginType = criterion.plugin || "ai";

            // If plugin is not set at all, set it to "ai"
            if (!criterion.plugin) {
              updatedCriteria[i] = {
                ...criterion,
                plugin: "ai",
              };
              needsConfigUpdate = true;
            }

            // If the plugin is not configured and supports default configs, create one
            if (
              pluginType !== "None" &&
              (!criterion.configuration || criterion.configuration.trim().length === 0) &&
              PluginConfigDialogs[pluginType]?.hasDefault
            ) {
              try {
                const token = await auth.getToken();
                if (token) {
                  const configId = await PluginService.createDefaultConfig(pluginType, token);
                  if (configId) {
                    updatedCriteria[i] = {
                      ...updatedCriteria[i],
                      configuration: configId,
                    };
                    needsConfigUpdate = true;
                  }
                }
              } catch (error) {
                console.error(`Failed to auto-configure ${pluginType}:`, error);
                // Continue with the update even if auto-config fails
              }
            }
          }

          // Update the rubric with auto-configured plugins
          const updatedRubric = needsConfigUpdate
            ? { ...response.rubric, criteria: updatedCriteria }
            : response.rubric;

          await new Promise((resolve) => setTimeout(resolve, 1000));
          await updateRubric(updatedRubric);

          onUpdate(updatedRubric);

          if (needsConfigUpdate) {
            toast.success("Rubric updated and plugins auto-configured with default settings");
          }
        }

        return response.message;
      } catch (error) {
        console.error("Error sending message:", error);
        return "An error occurred while processing your request. Please try again.";
      } finally {
        setIsApplyingEdit(false);
        setIsLoading(false);
      }
    },
    [auth, onUpdate, sendMessage, updateRubric],
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
              <RubricTabs
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

      <div className="hidden lg:block lg:h-full lg:col-span-4">
        <RubricTabs
          isApplyingEdit={isApplyingEdit}
          rubricData={rubric}
          onUpdate={onUpdate}
          disableEdit={isLoading}
        />
      </div>
    </div>
  );
}
