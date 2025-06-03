import type { LinkProps } from "@tanstack/react-router";
import {
  BookOpenCheck,
  BotMessageSquare,
  ClipboardPlus,
  Home,
  Library,
  LifeBuoy,
  Settings,
} from "lucide-react";
import type { ReactElement } from "react";

export type NavigationData = {
  title: string;
  icon: ReactElement;
  to: LinkProps["to"];
  preload?: LinkProps["preload"];
};

export const NavigationItems: NavigationData[] = [
  {
    title: "Home",
    icon: <Home className="size-4" />,
    to: "/home",
  },
  {
    title: "Create Rubric",
    icon: <ClipboardPlus className="size-4" />,
    to: "/rubrics/create",
    preload: false,
  },
  {
    title: "Manage Rubrics",
    icon: <Library className="size-4" />,
    to: "/rubrics",
  },
  {
    title: "Grade Assignments",
    icon: <BookOpenCheck className="size-4" />,
    to: "/gradings/create",
    preload: false,
  },
  {
    title: "AI Assistant",
    icon: <BotMessageSquare className="size-4" />,
    to: "/chat",
  },
];

export const settingsItems: NavigationData[] = [
  {
    title: "Settings",
    icon: <Settings className="size-4" />,
    to: "/",
  },
  {
    title: "Help",
    icon: <LifeBuoy className="size-4" />,
    to: "/",
  },
];
