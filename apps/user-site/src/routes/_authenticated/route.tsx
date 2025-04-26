import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  component: Outlet,
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isSignedIn) {
      throw redirect({
        to: "/signin",
        search: {
          redirect: location.href,
        },
      });
    }
  },
});
