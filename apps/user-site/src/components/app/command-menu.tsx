import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { NavigationData } from "@/types/navigation";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";

interface CommandMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  navigationItems?: NavigationData[];
}

export function CommandMenu({ open, setOpen, navigationItems }: CommandMenuProps) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
      // Close menu on Escape key
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    },
    [open, setOpen],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = useCallback(
    (to?: string) => {
      setOpen(false);
      if (!to) return;
      navigate({ to });
    },
    [navigate, setOpen],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." autoFocus />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {navigationItems?.map((item) => (
            <CommandItem
              key={item.to} // Use unique identifier instead of index
              onSelect={() => handleSelect(item.to)}
              className="flex items-center gap-2"
            >
              {item.icon}
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
