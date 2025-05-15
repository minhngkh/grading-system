import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const AuthenticatedRoute = createFileRoute("/_authenticated")({
  component: AuthComponent,
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

function AuthComponent() {
  return (
    <div className="p-10 space-y-10 size-full">
      <Outlet />
    </div>
  );
}
