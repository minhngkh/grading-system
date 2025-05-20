import AIChat from "@/pages/features/chat";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_features/chat")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AIChat />;
}
