import RubricView from "@/components/app/rubric-view";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RubricService } from "@/services/rubric-service";
import { Rubric } from "@/types/rubric";
import { useEffect, useState } from "react";

type RubricDialogProps = {
  rubricId: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ViewRubricDialog = ({
  rubricId,
  isOpen,
  onOpenChange,
}: RubricDialogProps) => {
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRubric = async () => {
      try {
        setIsLoading(true);
        const fetchedRubric = await RubricService.getRubric(rubricId);
        setRubric(fetchedRubric);
      } catch (error) {
        console.error("Error fetching rubric:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (isOpen) {
      fetchRubric();
    }
  }, [isOpen, rubricId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="min-w-[80%]">
        {isLoading ?
          <div>Loading...</div>
        : rubric ?
          <>
            <DialogHeader>
              <DialogTitle>{rubric?.rubricName}</DialogTitle>
            </DialogHeader>
            <div className="w-full h-full flex flex-col">
              <RubricView rubricData={rubric} showPlugins />
            </div>
          </>
        : <div>No rubric found</div>}
      </DialogContent>
    </Dialog>
  );
};
