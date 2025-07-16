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
import { ChevronDown, ChevronRight } from "lucide-react";
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
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set());

  // Sort score adjustments by createdAt date in descending order (newest first)
  const sortedScoreAdjustment = React.useMemo(() => {
    if (!scoreAdjustment || !Array.isArray(scoreAdjustment)) return [];

    return [...scoreAdjustment].sort((a, b) => {
      const dateA = new Date(a.attributes?.createdAt).getTime();
      const dateB = new Date(b.attributes?.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [scoreAdjustment]);

  const toggleRow = (adjustmentIndex: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(adjustmentIndex)) {
      newExpandedRows.delete(adjustmentIndex);
    } else {
      newExpandedRows.add(adjustmentIndex);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[60%] max-w-[95%] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base font-semibold">Score Adjustments</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            History of score adjustments for this assessment. Click on any row to view
            criterion breakdown.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          {sortedScoreAdjustment && sortedScoreAdjustment.length > 0 ?
            <div className="overflow-auto max-h-[60vh] border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="text-xs font-medium w-8"></TableHead>
                    <TableHead className="text-xs font-medium">Adjustment Date</TableHead>
                    <TableHead className="text-xs font-medium">Total Score</TableHead>
                    <TableHead className="text-xs font-medium">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedScoreAdjustment.map((adjustment, adjustmentIndex) => (
                    <React.Fragment key={adjustmentIndex}>
                      {/* Main row with total score */}
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleRow(adjustmentIndex)}
                      >
                        <TableCell className="text-xs p-2">
                          {expandedRows.has(adjustmentIndex) ?
                            <ChevronDown className="h-3 w-3" />
                          : <ChevronRight className="h-3 w-3" />}
                        </TableCell>
                        <TableCell className="font-medium text-xs">
                          {new Date(adjustment.attributes.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium">
                            {((adjustment.attributes.score * scaleFactor) / 100).toFixed(
                              2,
                            )}{" "}
                            / {scaleFactor}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {adjustment.attributes.adjustmentSource || "Manual Adjustment"}
                        </TableCell>
                      </TableRow>

                      {/* Expanded rows showing criterion breakdown */}
                      {expandedRows.has(adjustmentIndex) && (
                        <>
                          {/* Header for breakdown */}
                          <TableRow className="bg-muted/30">
                            <TableCell className="text-xs font-medium" colSpan={4}>
                              <div className="grid grid-cols-2 gap-4 pl-4">
                                <span>Criterion Name</span>
                                <span>Score</span>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Criterion breakdown rows */}
                          {adjustment.attributes.scoreBreakdowns.map(
                            (scoreBreakdown: ScoreBreakdown, scoreIndex: number) => (
                              <TableRow
                                key={`${adjustmentIndex}-breakdown-${scoreIndex}`}
                                className="bg-muted/10"
                              >
                                <TableCell className="text-xs" colSpan={4}>
                                  <div className="grid grid-cols-2 gap-4 pl-8">
                                    <span className="text-muted-foreground">
                                      {scoreBreakdown.criterionName}
                                    </span>
                                    <span>
                                      {(
                                        (scoreBreakdown.rawScore * scaleFactor) /
                                        100
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ),
                          )}
                        </>
                      )}
                    </React.Fragment>
                  ))}
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
