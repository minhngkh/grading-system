import RubricView from "@/components/app/rubric-view";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RubricService } from "@/services/rubric-service";
import { Rubric } from "@/types/rubric";
import { useEffect, useState } from "react";

type RubricDialogProps = {
  rubricId?: string;
  initialRubric?: Rubric;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ViewRubricDialog = ({
  rubricId,
  initialRubric,
  open,
  onOpenChange,
}: RubricDialogProps) => {
  const [rubric, setRubric] = useState<Rubric | undefined>(initialRubric);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRubric = async () => {
      if (!rubricId) return;

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

    if (!rubric) fetchRubric();
  }, [rubricId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="min-w-[80%]">
        <DialogHeader>
          <DialogTitle>View Rubric</DialogTitle>
          <DialogDescription>
            Review the details of the selected rubric.
          </DialogDescription>
        </DialogHeader>
        {isLoading ?
          <div>Loading...</div>
        : rubric ?
          <>
            <DialogHeader>
              <DialogTitle>{rubric?.rubricName}</DialogTitle>
            </DialogHeader>
            <div className="w-full h-[60vh] overflow-y-auto flex flex-col">
              <RubricView rubricData={rubric} showPlugins />
            </div>
          </>
        : <div>No rubric found</div>}
      </DialogContent>
    </Dialog>
  );
};
