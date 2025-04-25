import HomePage from "@/pages/home";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});
