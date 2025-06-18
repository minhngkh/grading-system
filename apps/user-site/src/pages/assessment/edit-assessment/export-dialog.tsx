import { useState } from "react";
import { Download, FileText, FileSpreadsheet, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AssessmentExporter } from "@/lib/exporters";
import { Assessment } from "@/types/assessment";

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

interface ExportDialogProps {
  assessmentData: Assessment;
}

export default function ExportDialog({ assessmentData }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    const exporter = new AssessmentExporter(assessmentData);
    switch (selectedType) {
      case "pdf":
        exporter.exportToPDF();
        break;
      case "excel":
        exporter.exportToExcel();
        break;
      default:
        break;
    }

    setLoading(false);
    setSuccess(true);

    // Show success for 1 second then close dialog
    setTimeout(() => {
      setSuccess(false);
      setOpen(false);
    }, 1000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          // Reset states when dialog closes
          setLoading(false);
          setSuccess(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose the format you'd like to export your data in.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup
            disabled={loading || success}
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
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading || success}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading || success} className="gap-2">
            {loading ?
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            : success ?
              <>
                <CheckCircle className="h-4 w-4" />
                Success!
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
