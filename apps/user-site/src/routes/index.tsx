import LandingPage from "@/pages/landing";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context, location }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/home",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: LandingPage,
});
