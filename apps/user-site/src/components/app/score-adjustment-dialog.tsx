import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScoreBreakdown } from "@/types/assessment";

interface ScoreAdjustmentDialogProps {
  scaleFactor: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scoreAdjustment: any[];
}

export const ScoreAdjustmentDialog: React.FC<ScoreAdjustmentDialogProps> = ({
  scaleFactor,
  open,
  onOpenChange,
  scoreAdjustment,
}) => {
  // Sort score adjustments by createdAt date in descending order (newest first)
  const sortedScoreAdjustment = React.useMemo(() => {
    if (!scoreAdjustment || !Array.isArray(scoreAdjustment)) return [];

    return [...scoreAdjustment].sort((a, b) => {
      const dateA = new Date(a.attributes?.createdAt).getTime();
      const dateB = new Date(b.attributes?.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [scoreAdjustment]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[60%] max-w-[95%] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base font-semibold">Score Adjustments</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            History of score adjustments for this assessment
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          {sortedScoreAdjustment && sortedScoreAdjustment.length > 0 ?
            <div className="overflow-auto max-h-[60vh] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="text-xs font-medium">Adjustment Date</TableHead>
                    <TableHead className="text-xs font-medium">Total Score</TableHead>
                    <TableHead className="text-xs font-medium">Criterion Name</TableHead>
                    <TableHead className="text-xs font-medium">Raw Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedScoreAdjustment.flatMap((adjustment, adjustmentIndex) =>
                    adjustment.attributes.scoreBreakdowns.map(
                      (scoreBreakdown: ScoreBreakdown, scoreIndex: number) => (
                        <TableRow key={`${adjustmentIndex}-${scoreIndex}`}>
                          {scoreIndex === 0 && (
                            <>
                              <TableCell
                                rowSpan={adjustment.attributes.scoreBreakdowns.length}
                                className="font-medium min-w-[180px] text-xs"
                              >
                                {new Date(
                                  adjustment.attributes.createdAt,
                                ).toLocaleString()}
                              </TableCell>
                              <TableCell
                                rowSpan={adjustment.attributes.scoreBreakdowns.length}
                                className="min-w-[120px] text-xs"
                              >
                                {(adjustment.attributes.score * scaleFactor) / 100}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="min-w-[150px] text-xs">
                            {scoreBreakdown.criterionName}
                          </TableCell>
                          <TableCell className="min-w-[120px] text-xs">
                            {(scoreBreakdown.rawScore * scaleFactor) / 100}
                          </TableCell>
                        </TableRow>
                      ),
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          : <div className="text-center py-8 text-muted-foreground">
              <p className="text-xs">No score adjustments found for this assessment.</p>
            </div>
          }
        </div>
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <span className="text-xs">Close</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
