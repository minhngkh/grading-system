import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PluginService } from "@/services/plugin-service";
import { Plugin } from "@/types/plugin";
import { Criteria } from "@/types/rubric";
import { useAuth } from "@clerk/clerk-react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";

interface PluginSelectDialogProps {
  open: boolean;
  criterion: Criteria;
  onOpenChange: (open: boolean) => void;
  onSelect: (plugin: string) => void;
}

interface PluginItemProps {
  plugin: Plugin;
  isSelected: boolean;
  onSelect: (plugin: string) => void;
}

// memoized plugin item component
const PluginItem = React.memo<PluginItemProps>(({ plugin, isSelected, onSelect }) => (
  <Card
    onClick={() => onSelect(plugin.name)}
    className={cn(
      "cursor-pointer transition-shadow hover:shadow-md border rounded-md gap-2",
      isSelected && "bg-muted",
    )}
  >
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <div>{plugin.name}</div>
        {isSelected && <Check className="size-4" />}
      </CardTitle>
      <Separator orientation="horizontal" />
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground line-clamp-3">{plugin.description}</p>
    </CardContent>
  </Card>
));

export function PluginSelectDialog({
  open,
  criterion,
  onOpenChange,
  onSelect,
}: PluginSelectDialogProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const auth = useAuth();

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchPlugins = useCallback(async () => {
    try {
      setIsLoading(true);

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const token = await auth.getToken();
      if (!token) {
        throw new Error("Unauthorized: No token found");
      }

      const plugins = await PluginService.getAll(token);
      if (!abortControllerRef.current.signal.aborted) {
        setPlugins([
          ...plugins,
          {
            alias: "none",
            name: "No Plugin",
            description: "Select this option if you don't want to use a plugin.",
            categories: [],
            enabled: true,
          },
        ]);
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        toast.error("Failed to fetch plugins. Please try again later.");
        console.error("Error fetching plugins:", error);
        setPlugins([
          {
            alias: "none",
            name: "No Plugin",
            description: "Select this option if you don't want to use a plugin.",
            categories: [],
            enabled: true,
          },
        ]);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[600px] max-h-[60vh] overflow-auto"
      >
        <DialogHeader>
          <DialogTitle>Select Plugin</DialogTitle>
        </DialogHeader>
        {isLoading ?
          <div className="flex justify-center items-center py-8">
            <div className="text-muted-foreground">Loading plugins...</div>
          </div>
        : plugins.length === 0 ?
          <div className="flex justify-center items-center py-8">
            <div className="text-muted-foreground">No plugins available</div>
          </div>
        : <div className="grid grid-cols-3 gap-4 py-4">
            {plugins.map((plugin, index) => {
              const isSelected =
                (!criterion.plugin && plugin.alias === "ai") ||
                criterion.plugin === plugin.name;
              return (
                <PluginItem
                  key={`${plugin.name}-${index}`}
                  plugin={plugin}
                  isSelected={isSelected}
                  onSelect={onSelect}
                />
              );
            })}
          </div>
        }
      </DialogContent>
    </Dialog>
  );
}
