import { memo } from "react";

import type { Rubric } from "@/types/rubric";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatRubricTable } from "@/pages/rubric/rubric-generation/chat/chat-rubric-table";
import PluginConfiguration from "@/pages/rubric/rubric-generation/chat/plugin";

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
        <PluginConfiguration rubricData={rubricData} onUpdate={onUpdate} />
      </TabsContent>
    </Tabs>
  );
}

export default memo(RubricTabs);
