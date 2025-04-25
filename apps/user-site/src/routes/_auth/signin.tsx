import { LoginForm } from "@/pages/auth/signin-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/signin")({
  component: LoginForm,
});
