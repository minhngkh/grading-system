import AIChat from "@/pages/chat";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/chat")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AIChat />;
}
