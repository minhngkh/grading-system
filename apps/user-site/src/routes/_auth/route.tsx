import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const AuthRoute = createFileRoute("/_auth")({
  component: RouteComponent,
  beforeLoad: ({ context, location }) => {
    if (context.auth.isSignedIn) {
      throw redirect({
        to: "/home",
        search: {
          redirect: location.href,
        },
      });
    }
  },
});

function RouteComponent() {
  return (
    <div className="size-full flex items-center justify-center">
      <Outlet />
    </div>
  );
}
