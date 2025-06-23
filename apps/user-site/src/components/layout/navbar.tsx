import { useTheme } from "@/context/theme-provider";
import { Button } from "@/components/ui/button";
import { CommandMenu } from "@/components/app/command-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SignedIn, SignedOut, useClerk } from "@clerk/clerk-react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Moon, Search, Sun, User } from "lucide-react";
import { useState } from "react";
import { NotificationButton } from "@/components/app/notification-button";

const UnauthenticatedNavBar = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full backdrop-blur-md sticky top-0 z-10 flex h-16 justify-end items-center gap-4 border-b bg-background/60 px-2 md:px-4">
      <div className="flex items-center flex-1">
        <h6
          onClick={() => navigate({ to: "/" })}
          className="text-xl font-bold cursor-pointer"
        >
          IntelliGrade
        </h6>
      </div>
      <div className="flex items-center gap-4">
        <Button asChild>
          <Link to="/signin">Sign In</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/signup">Sign Up</Link>
        </Button>
      </div>
    </header>
  );
};

const AuthenticatedNavBar = () => {
  const { signOut, user } = useClerk();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    await router.invalidate();
    navigate({ to: "/" });
  };

  return (
    <header className="w-full backdrop-blur-md sticky top-0 z-10 flex h-16 justify-end items-center gap-4 border-b bg-background/60 px-4">
      <div className="flex items-center flex-1">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mx-4 h-8!" />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="hidden md:flex h-9 md:w-[200px] lg:w-[300px] justify-start text-sm text-muted-foreground"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          Search...
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <CommandMenu open={commandOpen} setOpen={setCommandOpen} />
        <NotificationButton />
        <Button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          variant="ghost"
          size="icon"
          className="h-9 w-9"
        >
          {theme === "dark" ?
            <Sun className="h-5 w-5" />
          : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle Theme</span>
        </Button>
        <Separator orientation="vertical" className="h-8!" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.fullName ||
                user?.username ||
                user?.primaryEmailAddress?.emailAddress}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                navigate({
                  to: "/profile",
                })
              }
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export function AppNavbar() {
  return (
    <>
      <SignedOut>
        <UnauthenticatedNavBar />
      </SignedOut>
      <SignedIn>
        <AuthenticatedNavBar />
      </SignedIn>
    </>
  );
}
