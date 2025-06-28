import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/context/theme-provider";
import { AppNavbar } from "@/components/layout/navbar";
import { AppSidebar } from "@/components/layout/sidebar";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { NavigationItems } from "@/consts/navigations";

interface AppRouterContext {
  auth: ReturnType<typeof useAuth>;
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
  component: Root,
  errorComponent: ErrorBoundary,
});

function Root() {
  const { isSignedIn } = useAuth();
  return (
    <>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <SidebarProvider>
          {isSignedIn && <AppSidebar navigationItems={NavigationItems} />}
          <SidebarInset>
            <main className="flex-1 flex flex-col items-center">
              <AppNavbar />
              <div className="container space-y-10 flex-1 size-full">
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster position="top-right" closeButton expand richColors />
      </ThemeProvider>
    </>
  );
}
