import { memo } from "react";

import type { Rubric } from "@/types/rubric";
import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatRubricTable } from "@/pages/rubric/rubric-generation/chat/chat-rubric-table";
import PluginConfiguration from "@/pages/rubric/rubric-generation/chat/plugin";
import { updateRubricMutationOptions } from "@/queries/rubric-queries";

interface RubricTableProps {
  rubricData: Rubric;
  onUpdate?: (updatedRubric: Partial<Rubric>) => void;
  disableEdit?: boolean;
  isApplyingEdit?: boolean;
}

function RubricTabs({
  rubricData,
  onUpdate,
  disableEdit = false,
  isApplyingEdit = false,
}: RubricTableProps) {
  const auth = useAuth();
  const updateRubricMutation = useMutation(
    updateRubricMutationOptions(rubricData.id, auth),
  );

  const { mutateAsync: updateRubric } = updateRubricMutation;

  const handleUpdate = async (updatedRubric: Partial<Rubric>) => {
    await updateRubric(updatedRubric);

    if (onUpdate) {
      onUpdate(updatedRubric);
    }
  };

  return (
    <Tabs defaultValue="rubric" className="h-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="rubric">Rubric</TabsTrigger>
        <TabsTrigger value="plugin">Plugin</TabsTrigger>
      </TabsList>

      <TabsContent value="rubric">
        <ChatRubricTable
          rubricData={rubricData}
          onUpdate={onUpdate}
          disableEdit={disableEdit}
          isApplyingEdit={isApplyingEdit}
        />
      </TabsContent>

      <TabsContent value="plugin">
        <PluginConfiguration rubricData={rubricData} onUpdate={handleUpdate} />
      </TabsContent>
    </Tabs>
  );
}

export default memo(RubricTabs);
