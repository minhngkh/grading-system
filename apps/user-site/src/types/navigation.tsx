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
};

export const navigationItems: NavigationData[] = [
  {
    title: "Home",
    icon: <Home className="size-4" />,
    to: "/home",
  },
  {
    title: "Rubric Generation",
    icon: <ClipboardPlus className="size-4" />,
    to: "/rubric-generation",
  },
  {
    title: "Rubric Management",
    icon: <Library className="size-4" />,
    to: "/manage-rubrics",
  },
  {
    title: "Submission Grading",
    icon: <BookOpenCheck className="size-4" />,
    to: "/assignment-grading",
  },
  {
    title: "Chat with AI",
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
