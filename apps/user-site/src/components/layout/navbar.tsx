import { useTheme } from "@/context/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SignedIn, SignedOut, useClerk } from "@clerk/clerk-react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Bell, Settings, User } from "lucide-react";

const UnauthenticatedNavBar = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full backdrop-blur-md sticky top-0 z-10 flex h-16 justify-end items-center gap-4 border-b bg-background/60 px-2 md:px-4">
      <div className="flex items-center flex-1">
        <h6
          onClick={() => navigate({ to: "/" })}
          className="text-xl font-bold cursor-pointer"
        >
          Assessly
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

  const handleLogout = async () => {
    const confirm = window.confirm("Are you sure you want to logout?");
    if (confirm) {
      await signOut();
      await router.invalidate();
      navigate({ to: "/" });
    }
  };

  return (
    <header className="w-full backdrop-blur-md sticky top-0 z-10 flex h-16 justify-end items-center gap-4 border-b bg-background/60 px-4">
      <div className="flex items-center flex-1">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mx-4 h-8!" />
      </div>
      <div className="flex items-center gap-2">
        <form className="hidden md:block w-full">
          <div className="relative">
            <Input
              id="search"
              name="search"
              type="search"
              placeholder="Search..."
              className="h-9 md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          variant="ghost"
          size="icon"
          className="h-9 w-9"
        >
          <Settings className="h-5 w-5" />
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
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
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
