import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
] as const;

interface ExportDialogProps<TArgs extends any[]> {
  exporterClass: new (...args: TArgs) => DataExporter;
  args: TArgs;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
}

export function ExportDialog<TArgs extends any[]>({
  exporterClass,
  args,
  open,
  onOpenChange,
  isLoading,
}: ExportDialogProps<TArgs>) {
  const [selectedType, setSelectedType] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSuccess(true);
      setLoading(false);
    } else {
      // Cancel any ongoing export when dialog closes
      abortControllerRef.current?.abort();
    }
  }, [open]);

  // Memoize exporter instance creation to avoid recreation
  const exporter = useMemo(() => {
    return new exporterClass(...args);
  }, [exporterClass, args]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setSuccess(true);

    // Create new abort controller for this export
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

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

      if (!abortControllerRef.current.signal.aborted) {
        await setTimeout(() => {
          toast.success("Export completed successfully!");
        }, 1000);
        onOpenChange?.(false);
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        toast.error(
          `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        setSuccess(false);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedType, exporter, onOpenChange]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const handleTypeChange = useCallback((value: string) => {
    setSelectedType(value);
  }, []);

  const memoizedExportTypes = useMemo(() => exportTypes, []);

  const buttonState = useMemo(
    () => ({
      disabled: loading,
      content:
        loading ?
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting...
          </>
        : <>
            <Download className="h-4 w-4" />
            Export
          </>,
    }),
    [loading],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose the format you'd like to export your data in.
          </DialogDescription>
        </DialogHeader>
        {isLoading ?
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div className="text-muted-foreground">Preparing data for export...</div>
          </div>
        : <>
            <div className="grid gap-4 py-4">
              <RadioGroup
                disabled={loading}
                value={selectedType}
                onValueChange={handleTypeChange}
              >
                {memoizedExportTypes.map((type) => (
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
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={buttonState.disabled}
                className="gap-2"
              >
                {buttonState.content}
              </Button>
            </DialogFooter>
          </>
        }
      </DialogContent>
    </Dialog>
  );
}
