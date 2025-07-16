import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plugin } from "@/types/plugin";
import { useAuth } from "@clerk/clerk-react";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAllPluginsQueryOptions } from "@/queries/plugin-queries";
import { plugins } from "@/consts/plugins";

interface PluginSelectDialogProps {
  open: boolean;
  currentPlugin?: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (plugin: string) => void;
}

interface PluginItemProps {
  plugin: Plugin;
  isSelected: boolean;
  onSelect: (plugin: string) => void;
}

const PluginItem = React.memo<PluginItemProps>(({ plugin, isSelected, onSelect }) => (
  <Card
    onClick={() => onSelect(plugin.id)}
    className={cn(
      "cursor-pointer transition-shadow hover:shadow-md border rounded-md gap-2",
      isSelected && "bg-muted",
    )}
  >
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <div>
          {plugin.id ?
            plugins[plugin.id as keyof typeof plugins] || "Unknown"
          : plugins["ai"]}
        </div>
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
  currentPlugin,
  onOpenChange,
  onSelect,
}: PluginSelectDialogProps) {
  const auth = useAuth();
  const { isLoading, data } = useQuery(
    getAllPluginsQueryOptions(auth, {
      staleTime: Infinity,
    }),
  );

  const plugins: Plugin[] = [
    ...(data || []),
    {
      id: "None",
      name: "Manual Grading",
      description: "Leave this criterion ungraded and manually grade later",
      enabled: true,
      categories: [],
    },
  ];

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
        : plugins === undefined ?
          <div className="flex justify-center items-center py-8">
            <div className="text-red-500">Failed to load plugins. Please try again.</div>
          </div>
        : plugins.length === 0 ?
          <div className="flex justify-center items-center py-8">
            <div className="text-muted-foreground">No plugins available</div>
          </div>
        : <div className="grid grid-cols-3 gap-4 py-4">
            {plugins.map((plugin, index) => {
              const isSelected =
                (!currentPlugin && plugin.id === "ai") || currentPlugin === plugin.id;
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
