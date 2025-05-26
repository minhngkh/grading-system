import type { Tool } from "@/types/tool";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToolType } from "@/types/tool";
import { Link } from "@tanstack/react-router";

interface ToolsListProps {
  tools: Tool[];
}

export function ToolsList({ tools }: ToolsListProps) {
  if (tools.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">
          No tools found. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map((tool, index) => (
        <Link
          key={index}
          to={tool.navigation}
          params={tool.params}
          preload={tool.preload === false ? false : "intent"}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{tool.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{tool.details}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <Badge>{ToolType[tool.type]}</Badge>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
