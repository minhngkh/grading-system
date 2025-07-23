import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PluginName } from "@/consts/plugins";
import { StaticAnalysisMetadata } from "./static-analysis-metadata";
import { TestRunnerMetadata } from "./test-runner-metadata";

interface PluginMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pluginType: string;
  metadata: unknown;
  criterionName: string;
}

export function PluginMetadataDialog({
  open,
  onOpenChange,
  pluginType,
  metadata,
  criterionName,
}: PluginMetadataDialogProps) {
  const renderMetadataComponent = () => {
    if (!metadata || typeof metadata !== "object") {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No metadata available for this criterion.
        </div>
      );
    }

    switch (pluginType) {
      case "test-runner":
        return <TestRunnerMetadata metadata={metadata as any} />;
      case "static-analysis":
        return <StaticAnalysisMetadata metadata={metadata as any} />;
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Metadata display not available for plugin type: {pluginType}
          </div>
        );
    }
  };

  const getPluginName = () => {
    return PluginName[pluginType as keyof typeof PluginName] || pluginType;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {getPluginName()} Results - {criterionName}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {renderMetadataComponent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
