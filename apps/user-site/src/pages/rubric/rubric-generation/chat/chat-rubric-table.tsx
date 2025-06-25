import type { Rubric } from "@/types/rubric";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditRubric } from "@/components/app/edit-rubric";
import { Spinner } from "@/components/app/spinner";
import { useState, useCallback, memo } from "react";
import { PencilIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RubricContextUploadDialog } from "./context-upload-dialog";
import { toast } from "sonner";
import { RubricService } from "@/services/rubric-service";
import { useAuth } from "@clerk/clerk-react";
import { lazy, Suspense } from "react";

const RubricView = lazy(() =>
  import("@/components/app/rubric-view").then((module) => ({
    default: module.RubricView,
  })),
);

interface RubricTableProps {
  rubricData: Rubric;
  onUpdate?: (updatedRubric: Partial<Rubric>) => void;
  disableEdit?: boolean;
  isApplyingEdit?: boolean;
}

function LoadingFallback({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Spinner />
      <p>{message || "Loading rubric. Please wait..."}</p>
    </div>
  );
}

function ChatRubricTable({
  rubricData,
  onUpdate,
  disableEdit = false,
  isApplyingEdit = false,
}: RubricTableProps) {
  const [isEditingDialogOpen, setIsEditingDialogOpen] = useState(false);
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
  const auth = useAuth();

  const handleUploadContext = useCallback(
    async (files: File[], newAttachments: string[]) => {
      const token = await auth.getToken();
      if (!token) return toast.error("You are not authorized to perform this action.");

      try {
        let isChanged = false;

        const removedAttachments = rubricData.attachments?.filter(
          (file) => !newAttachments.includes(file),
        );

        if (removedAttachments?.length) {
          await Promise.all(
            removedAttachments.map((file) =>
              RubricService.deleteAttachment(rubricData.id, file, token),
            ),
          );
          isChanged = true;
        }

        if (files.length > 0) {
          await RubricService.uploadContext(rubricData.id, files, token);
          isChanged = true;
        }

        if (isChanged) {
          const updatedAttachments = [
            ...newAttachments,
            ...files.map((file) => file.name),
          ];

          onUpdate?.({ attachments: updatedAttachments });
          toast.success("Context files updated successfully.");
        }

        setIsContextDialogOpen(false);
      } catch (error) {
        console.error("Error updating context files:", error);
        toast.error("Failed to update context files. Please try again.");
      }
    },
    [auth, rubricData.id, rubricData.attachments, onUpdate],
  );

  const handleOpenContextDialog = useCallback(() => setIsContextDialogOpen(true), []);
  const handleOpenEditDialog = useCallback(() => setIsEditingDialogOpen(true), []);

  return (
    <div className="flex flex-col size-full gap-4">
      <Card className="flex-1">
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{rubricData.rubricName}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleOpenContextDialog}>
                <Plus className="size-4" /> Context
              </Button>
              <Button
                disabled={disableEdit || isApplyingEdit}
                onClick={handleOpenEditDialog}
              >
                <PencilIcon className="size-4" /> Edit
              </Button>
            </div>
          </div>
          <CardDescription>
            Edit the rubric manually or use AI to modify it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {isApplyingEdit ?
            <LoadingFallback message="Agent is modifying the rubric. Please wait..." />
          : <div className="h-full overflow-y-auto relative">
              <div className="h-full absolute top-0 left-0 right-0">
                <Suspense
                  fallback={
                    <LoadingFallback message="Loading rubric view. Please wait..." />
                  }
                >
                  <RubricView rubricData={rubricData} />
                </Suspense>
              </div>
            </div>
          }
          {isEditingDialogOpen && (
            <EditRubric
              open={isEditingDialogOpen}
              onOpenChange={setIsEditingDialogOpen}
              rubricData={rubricData}
              onUpdate={onUpdate}
            />
          )}
          {isContextDialogOpen && (
            <RubricContextUploadDialog
              attachments={rubricData.attachments}
              open={isContextDialogOpen}
              onOpenChange={setIsContextDialogOpen}
              onConfirm={handleUploadContext}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(ChatRubricTable);
