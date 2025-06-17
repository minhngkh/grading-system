import { Button } from "@/components/ui/button";
import CodeRunnerConfigDialog from "@/pages/rubric/rubric-generation/plugins/code-runner";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/test")({
  component: RouteComponent,
});

function RouteComponent() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex items-center justify-center size-full">
      <Button onClick={() => setDialogOpen(true)}>Open Code Runner Config Dialog</Button>
      <CodeRunnerConfigDialog
        criterionIndex={0}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
