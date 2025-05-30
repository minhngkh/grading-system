import UserProfile from "@/pages/user-profile";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile")({
  component: UserProfile,
});
