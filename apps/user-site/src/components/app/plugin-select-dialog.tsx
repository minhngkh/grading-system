import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PluginService } from "@/services/plugin-service";
import { Plugin } from "@/types/plugin";
import { Criteria } from "@/types/rubric";
import { useAuth } from "@clerk/clerk-react";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";

interface PluginSelectDialogProps {
  open: boolean;
  criterion: Criteria;
  onOpenChange: (open: boolean) => void;
  onSelect: (index: number, plugin: string) => void;
}

export const PluginSelectDialog = React.memo(function PluginSelectDialog({
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

  // Memoized fetch function to prevent recreation on every render
  const fetchPlugins = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      // Cancel previous request if still pending
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const token = await auth.getToken();
      if (!token) {
        throw new Error("Unauthorized: No token found");
      }

      const plugins = await PluginService.getAll(token);

      // Check if component is still mounted and request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        if (plugins.success) {
          setPlugins(plugins.data);
        } else {
          throw new Error(plugins.error.message);
        }
      }
    } catch (error) {
      // Only handle error if component is still mounted and not aborted
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
      // Cancel any ongoing requests when dialog closes
      abortControllerRef.current?.abort();
    }
  }, [open, fetchPlugins]);

  // Memoize filtered enabled plugins to prevent unnecessary recalculations
  const enabledPlugins = useMemo(() => {
    return plugins.filter((plugin) => plugin.enabled);
  }, [plugins]);

  // Memoize dialog close handler
  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange(open);
    },
    [onOpenChange],
  );

  // Memoize plugin selection handler
  const handlePluginSelect = useCallback(
    (index: number, pluginName: string) => {
      onSelect(index, pluginName);
    },
    [onSelect],
  );

  // Memoize retry handler
  const handleRetry = useCallback(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  // Memoize render content to prevent unnecessary re-renders
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
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
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
                onClick={() => handlePluginSelect(index, plugin.name)}
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
});
