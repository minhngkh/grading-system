import { useState } from "react";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DataExporter } from "@/lib/exporters";
import { toast } from "sonner";

const exportTypes = [
  {
    id: "pdf",
    name: "PDF Document",
    description: "Portable Document Format",
    icon: <FileText className="h-5 w-5 text-muted-foreground" />,
  },
  {
    id: "excel",
    name: "Excel Spreadsheet",
    description: "Microsoft Excel format",
    icon: <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />,
  },
];

interface ExportDialogProps<TArgs extends any[]> {
  exporterClass: new (...args: TArgs) => DataExporter;
  args: TArgs;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ExportDialog<TArgs extends any[]>({
  exporterClass,
  args,
  open,
  onOpenChange,
}: ExportDialogProps<TArgs>) {
  const [selectedType, setSelectedType] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(true);

  const handleExport = async () => {
    setLoading(true);
    setSuccess(true);

    const exporter = new exporterClass(...args);
    try {
      switch (selectedType) {
        case "pdf":
          exporter.exportToPDF();
          break;
        case "excel":
          exporter.exportToExcel();
          break;
        default:
          throw new Error(`Unsupported export type: ${selectedType}`);
      }

      onOpenChange?.(false);
    } catch (error) {
      toast.error(
        `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose the format you'd like to export your data in.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup
            disabled={loading}
            value={selectedType}
            onValueChange={setSelectedType}
          >
            {exportTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-3">
                <RadioGroupItem value={type.id} id={type.id} />
                <Label
                  htmlFor={type.id}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  {type.icon}
                  <div className="grid gap-1">
                    <div className="font-medium">{type.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        {!success && !loading && (
          <div className="text-destructive">Export failed. Please try again.</div>
        )}
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            {loading ?
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            : <>
                <Download className="h-4 w-4" />
                Export
              </>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
