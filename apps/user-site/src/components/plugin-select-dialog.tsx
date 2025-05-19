import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Plugin {
  name: string;
  description: string;
}

interface PluginSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (plugin: string) => void;
}

const plugins: Plugin[] = [
  {
    name: "AI",
    description: "Use AI to analyze and provide feedback on student submissions",
  },
  {
    name: "Code Runner",
    description: "Execute and test code submissions automatically",
  },
  {
    name: "Static Analysis",
    description: "Analyze code quality, style, and potential issues without execution",
  },
];

export function PluginSelectDialog({
  open,
  onOpenChange,
  onSelect,
}: PluginSelectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Plugin</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <div className="grid grid-cols-3 gap-4 py-4">
            {plugins.map((plugin) => (
              <button
                key={plugin.name}
                className="flex flex-col gap-2 items-center text-center p-4 hover:bg-muted rounded-md border"
                onClick={() => onSelect(plugin.name)}
              >
                <div className="font-medium">{plugin.name}</div>
                <div className="text-xs text-muted-foreground">{plugin.description}</div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
