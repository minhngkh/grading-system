import { Button } from "@/components/ui/button";
import { RubricContextUploadDialog } from "@/pages/rubric/rubric-generation/chat/context-upload-dialog";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/test")({
  component: RouteComponent,
});

function RouteComponent() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <RubricContextUploadDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
