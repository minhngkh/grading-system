import { EditRubric } from "@/components/app/edit-rubric";
import { Spinner } from "@/components/app/spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { RubricContextUploadDialog } from "@/pages/rubric/rubric-generation/chat/context-upload-dialog";
import {
  uploadContextMutationOptions,
  updateRubricMutationOptions,
} from "@/queries/rubric-queries";
import { RubricService } from "@/services/rubric-service";
import { Rubric } from "@/types/rubric";
import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { Plus, PencilIcon } from "lucide-react";
import { lazy, memo, Suspense, useCallback, useState } from "react";
import { toast } from "sonner";

const RubricView = lazy(() =>
  import("@/components/app/rubric-view").then((module) => ({
    default: module.RubricView,
  })),
);

function LoadingFallback({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Spinner />
      <p>{message || "Loading rubric. Please wait..."}</p>
    </div>
  );
}

function areRecordsEqual(
  a: Record<string, string> | undefined | null,
  b: Record<string, string> | undefined | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}

interface ChatRubricTableProps {
  rubricData: Rubric;
  onUpdate?: (updatedRubric: Partial<Rubric>) => void;
  disableEdit?: boolean;
  isApplyingEdit?: boolean;
}

export const ChatRubricTable = memo(
  ({
    rubricData,
    onUpdate,
    disableEdit = false,
    isApplyingEdit = false,
  }: ChatRubricTableProps) => {
    const [isEditingDialogOpen, setIsEditingDialogOpen] = useState(false);
    const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
    const auth = useAuth();
    const { isPending, mutateAsync: uploadContext } = useMutation(
      uploadContextMutationOptions(rubricData.id, auth),
    );

    const updateRubricMutation = useMutation(
      updateRubricMutationOptions(rubricData.id, auth),
    );

    const handleOpenContextDialog = useCallback(() => setIsContextDialogOpen(true), []);
    const handleOpenEditDialog = useCallback(() => setIsEditingDialogOpen(true), []);

    const { mutateAsync: deleteAttachments } = useMutation({
      mutationFn: async (files: string[]) => {
        const token = await auth.getToken();
        if (!token) return toast.error("You are not authorized to perform this action.");
        return Promise.all(
          files.map(async (file) => {
            try {
              await RubricService.deleteAttachment(rubricData.id, file, token);
            } catch (error) {
              console.error("Error deleting attachment:", error);
              toast.error(`Failed to delete attachment: ${file}`);
            }
          }),
        );
      },
    });

    const handleUploadContext = useCallback(
      async (
        files: File[],
        newAttachments?: string[],
        metadata?: Record<string, string>,
      ) => {
        try {
          if (!areRecordsEqual(rubricData.metadata, metadata)) {
            await updateRubricMutation.mutateAsync({
              metadata: metadata,
            });

            onUpdate?.({ metadata: metadata });
          }

          let isChanged = false;

          if (newAttachments) {
            const removedAttachments = rubricData.attachments?.filter(
              (file) => !newAttachments?.includes(file),
            );

            if (removedAttachments?.length) {
              await deleteAttachments(removedAttachments);
              isChanged = true;
            }
          }

          if (files.length > 0) {
            await uploadContext(files);
            isChanged = true;
          }

          if (isChanged) {
            const updatedAttachments = [
              ...(newAttachments ?? []),
              ...files.map((file) => file.name),
            ];

            onUpdate?.({ attachments: updatedAttachments });
            toast.success("Context updated successfully.");
          }
        } catch (error) {
          console.error("Error updating files:", error);
          toast.error("Failed to update files. Please try again.");
        }
      },
      [auth, rubricData.id, rubricData.attachments, onUpdate],
    );

    const handleEditRubric = useCallback(
      async (updatedRubric: Partial<Rubric>) => {
        try {
          await updateRubricMutation.mutateAsync(updatedRubric);
          onUpdate?.(updatedRubric);
          toast.success("Rubric updated successfully.");
        } catch (error) {
          console.error("Error updating rubric:", error);
          toast.error("Failed to update rubric. Please try again.");
        }
      },
      [updateRubricMutation, onUpdate],
    );

    return (
      <>
        <Card className="h-full">
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <CardTitle>{rubricData.rubricName}</CardTitle>
                <CardDescription>
                  Edit the rubric manually or use AI to modify it.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleOpenContextDialog}>
                  <Plus className="size-4" /> Context
                </Button>
                <Button
                  size="sm"
                  disabled={disableEdit || isApplyingEdit}
                  onClick={handleOpenEditDialog}
                >
                  <PencilIcon className="size-4" /> Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {isApplyingEdit ?
              <LoadingFallback message="Agent is modifying the rubric. Please wait..." />
            : updateRubricMutation.isPending ?
              <LoadingFallback message="Updating rubric..." />
            : <div className="h-full overflow-auto relative">
                <div className="grid absolute top-0 left-0 right-0">
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
          </CardContent>
        </Card>
        {isEditingDialogOpen && (
          <EditRubric
            open={isEditingDialogOpen}
            onOpenChange={setIsEditingDialogOpen}
            rubricData={rubricData}
            onUpdate={handleEditRubric}
          />
        )}

        {isContextDialogOpen && (
          <RubricContextUploadDialog
            isPending={isPending}
            attachments={rubricData.attachments}
            metadata={rubricData.metadata}
            open={isContextDialogOpen}
            onOpenChange={setIsContextDialogOpen}
            onConfirm={handleUploadContext}
          />
        )}
      </>
    );
  },
);
