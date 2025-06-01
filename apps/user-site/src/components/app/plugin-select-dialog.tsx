import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PluginService } from "@/services/plugin-service";
import { Plugin } from "@/types/plugin";
import { Criteria } from "@/types/rubric";
import React from "react";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function fetchPlugins() {
      try {
        setIsLoading(true);
        const plugins = await PluginService.getAll();

        if (plugins.success) setPlugins(plugins.data);
        else throw new Error(plugins.error.message);
      } catch (error) {
        toast.error("Failed to fetch plugins. Please try again later.");
        console.error("Error fetching plugins:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      fetchPlugins();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Plugin</DialogTitle>
        </DialogHeader>
        {isLoading ?
          <div className="flex justify-center items-center">
            <div className="text-muted-foreground">Loading plugins...</div>
          </div>
        : plugins.length === 0 ?
          <div className="flex justify-center items-center">
            <div className="text-muted-foreground">No plugins available</div>
          </div>
        : <div className="max-h-[60vh] overflow-auto">
            <div className="grid grid-cols-3 gap-4 py-4">
              {plugins.map((plugin, index) => {
                if (!plugin.enabled) return null; // Skip disabled plugins
                return (
                  <button
                    key={index}
                    className={cn(
                      "flex flex-col gap-2 items-center text-center p-4 hover:bg-muted rounded-md border",
                      criterion.plugin === plugin.name && "bg-muted",
                    )}
                    onClick={() => {
                      onSelect(index, plugin.name);
                      onOpenChange(false);
                    }}
                  >
                    <div className="font-medium">
                      {plugin.name}
                      {criterion.plugin === plugin.name && " (Selected)"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {plugin.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        }
      </DialogContent>
    </Dialog>
  );
});
