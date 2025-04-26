import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/context/theme-provider";
import { AppNavbar } from "@/pages/navbar";
import { AppSidebar } from "@/pages/sidebar";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useAuth } from "@clerk/clerk-react";

interface MyRouterContext {
  auth: ReturnType<typeof useAuth>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => <Root />,
});

function Root() {
  const auth = useAuth();

  return (
    <>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <SidebarProvider>
          {auth.isSignedIn && <AppSidebar />}
          <SidebarInset>
            <main className="flex-1 flex flex-col items-center">
              <AppNavbar />
              <div className="container space-y-10 p-10 flex-1 size-full">
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
      <TanStackRouterDevtools />
    </>
  );
}
