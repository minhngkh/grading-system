import type { AuthContextProps } from "@/context/auth-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-provider";
import { ThemeProvider } from "@/context/theme-provider";
import { AppNavbar } from "@/pages/navbar";
import { AppSidebar } from "@/pages/sidebar";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

interface MyRouterContext {
  auth: AuthContextProps;
}

const Root = () => {
  const auth = useAuth();

  return (
    <>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <SidebarProvider>
          {auth.isAuthenticated && <AppSidebar />}
          <SidebarInset>
            <main className="flex-1 flex flex-col items-center">
              <AppNavbar />
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
      <TanStackRouterDevtools />
    </>
  );
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => <Root />,
});
