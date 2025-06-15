import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PluginService } from "@/services/plugin-service";
import { Plugin } from "@/types/plugin";
import { Criteria } from "@/types/rubric";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";

interface PluginSelectDialogProps {
  open: boolean;
  criterion: Criteria;
  onOpenChange: (open: boolean) => void;
  onSelect: (plugin: string) => void;
}

export function PluginSelectDialog({
  open,
  criterion,
  onOpenChange,
  onSelect,
}: PluginSelectDialogProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const auth = useAuth();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchPlugins = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const token = await auth.getToken();
      if (!token) {
        throw new Error("Unauthorized: No token found");
      }

      const plugins = await PluginService.getAll(token);

      if (!abortControllerRef.current.signal.aborted) {
        if (plugins.success) {
          setPlugins(plugins.data);
        } else {
          throw new Error(plugins.error.message);
        }
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage = "Failed to fetch plugins. Please try again later.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error fetching plugins:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPlugins();
    } else {
      abortControllerRef.current?.abort();
    }
  }, [open, fetchPlugins]);

  const enabledPlugins = useMemo(() => {
    return plugins.filter((plugin) => plugin.enabled);
  }, [plugins]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange(open);
    },
    [onOpenChange],
  );

  const handlePluginSelect = useCallback(
    (pluginName: string) => {
      onSelect(pluginName);
    },
    [onSelect],
  );

  const handleRetry = useCallback(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const renderContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="text-muted-foreground">Loading plugins...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col justify-center items-center py-8 gap-4">
          <div className="text-muted-foreground">{error}</div>
          <Button onClick={handleRetry}>Retry</Button>
        </div>
      );
    }

    if (enabledPlugins.length === 0) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="text-muted-foreground">No plugins available</div>
        </div>
      );
    }

    return (
      <div className="max-h-[60vh] overflow-auto">
        <div className="grid grid-cols-3 gap-4 py-4">
          {enabledPlugins.map((plugin, index) => {
            const isSelected = criterion.plugin === plugin.name;

            return (
              <button
                key={`${plugin.name}-${index}`} // More stable key
                className={cn(
                  "flex flex-col gap-2 items-center text-center p-4 hover:bg-muted rounded-md border transition-colors",
                  isSelected && "bg-muted ring-2 ring-primary",
                )}
                onClick={() => handlePluginSelect(plugin.name)}
              >
                <div className="font-medium">
                  {plugin.name}
                  {isSelected && " (Selected)"}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-3">
                  {plugin.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }, [
    isLoading,
    error,
    enabledPlugins,
    criterion.plugin,
    handleRetry,
    handlePluginSelect,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Plugin</DialogTitle>
        </DialogHeader>
        {renderContent}
      </DialogContent>
    </Dialog>
  );
}
