import { SignUpForm } from "@/pages/auth/signup-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/signup")({
  component: SignUpForm,
});
